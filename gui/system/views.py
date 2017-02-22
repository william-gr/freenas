# Copyright 2010 iXsystems, Inc.
# All rights reserved
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted providing that the following conditions
# are met:
# 1. Redistributions of source code must retain the above copyright
#    notice, this list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright
#    notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
# IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
# OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
# HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
# STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
# IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
#
#####################################################################
from collections import OrderedDict, namedtuple
import pickle as pickle
import datetime
import json
import logging
import os
import re
import shutil
import socket
import subprocess
import sysctl
import tarfile
import tempfile
import time
import urllib.request, urllib.parse, urllib.error
import xmlrpc.client
import traceback
import sys

from wsgiref.util import FileWrapper
from django.core.urlresolvers import reverse
from django.db import transaction
from django.http import (
    HttpResponse,
    HttpResponseRedirect,
    StreamingHttpResponse,
)
from django.shortcuts import render, redirect
from django.utils.translation import ugettext as _
from django.views.decorators.cache import never_cache

from freenasOS import Configuration
from freenasOS.Exceptions import UpdateManifestNotFound
from freenasOS.Update import (
    ActivateClone,
    CheckForUpdates,
    DeleteClone,
    FindClone,
    CloneSetAttr,
)
from freenasUI.account.models import bsdUsers
from freenasUI.common.system import (
    get_sw_name,
    get_sw_version,
    send_mail
)
from freenasUI.common.ssl import (
    export_certificate,
    export_certificate_chain,
    export_privatekey,
)
from freenasUI.freeadmin.apppool import appPool
from freenasUI.freeadmin.views import JsonResp
from freenasUI.middleware.exceptions import MiddlewareError
from freenasUI.middleware.notifier import notifier
from freenasUI.middleware.zfs import zpool_list
from freenasUI.network.models import GlobalConfiguration
from freenasUI.storage.models import Volume
from freenasUI.system import forms, models
from freenasUI.system.utils import (
    UpdateHandler,
    VerifyHandler,
    debug_get_settings,
    debug_generate,
    factory_restore,
    run_updated,
    is_update_applied
)
from middlewared.plugins.update import CheckUpdateHandler, get_changelog, parse_changelog

GRAPHS_DIR = '/var/db/graphs'
VERSION_FILE = '/etc/version'
PGFILE = '/tmp/.extract_progress'
INSTALLFILE = '/tmp/.upgrade_install'
BOOTENV_DELETE_PROGRESS = '/tmp/.bootenv_bulkdelete'
RE_DD = re.compile(r"^(\d+) bytes", re.M | re.S)
PERFTEST_SIZE = 40 * 1024 * 1024 * 1024  # 40 GiB

log = logging.getLogger('system.views')


def _system_info(request=None):
    # OS, hostname, release
    __, hostname, __ = os.uname()[0:3]
    platform = sysctl.filter('hw.model')[0].value
    physmem = '%dMB' % (
        sysctl.filter('hw.physmem')[0].value / 1048576,
    )
    # All this for a timezone, because time.asctime() doesn't add it in.
    date = time.strftime('%a %b %d %H:%M:%S %Z %Y') + '\n'
    uptime = subprocess.check_output(
        "env -u TZ uptime | awk -F', load averages:' '{ print $1 }'",
        shell=True
    )
    loadavg = "%.2f, %.2f, %.2f" % os.getloadavg()

    try:
        freenas_build = get_sw_version()
    except:
        freenas_build = "Unrecognized build"

    return {
        'hostname': hostname,
        'platform': platform,
        'physmem': physmem,
        'date': date,
        'uptime': uptime,
        'loadavg': loadavg,
        'freenas_build': freenas_build,
    }


def system_info(request):
    sysinfo = _system_info(request)
    sysinfo['info_hook'] = appPool.get_system_info(request)
    return render(request, 'system/system_info.html', sysinfo)


def bootenv_datagrid(request):
    bootzvolstats = notifier().zpool_status('freenas-boot')
    bootme = notifier().zpool_parse('freenas-boot')
    zlist = zpool_list(name='freenas-boot')
    try:
        advanced = models.Advanced.objects.order_by('-id')[0]
    except:
        advanced = models.Advanced.objects.create()

    return render(request, 'system/bootenv_datagrid.html', {
        'actions_url': reverse('system_bootenv_datagrid_actions'),
        'resource_url': reverse('api_dispatch_list', kwargs={
            'api_name': 'v1.0',
            'resource_name': 'system/bootenv',
        }),
        'structure_url': reverse('system_bootenv_datagrid_structure'),
        'bootme': bootme,
        'stats': bootzvolstats,
        'advanced': advanced,
        'zlist': zlist,
    })


def bootenv_datagrid_actions(request):
    onclick = '''function() {
    var mybtn = this;
    for (var i in grid.selection) {
        var data = grid.row(i).data;
        editObject('%s', data.%s, [mybtn,]);
    }
}'''

    onselectafter = '''function(evt, actionName, action) {
    for(var i=0;i < evt.rows.length;i++) {
        var row = evt.rows[i];
        if(%s) {
            query(".grid" + actionName).forEach(function(item, idx) {
                domStyle.set(item, "display", "none");
            });
            break;
        }
     }
}'''
    actions = {
        _('Clone'): {
            'on_click': onclick % (_('Clone'), '_add_url'),
            'button_name': _('Clone'),
        },
        _('Delete'): {
            'on_click': onclick % (_('Delete'), '_delete_url'),
            'on_select_after': onselectafter % (
                'row.data._delete_url === undefined'
            ),
            'button_name': _('Delete'),
        },
        _('DeleteBulk'): {
            'on_click': """
function() {
    var mybtn = this;
    var ids = [];
    for (var i in grid.selection) {
        var data = grid.row(i).data;
        ids.push(data.id);
    }
    editObject('Delete In Bulk',data._deletebulk_url + '?ids=' + ids.join(","),
        [mybtn,]);
}""",
            'on_select_after': """function(evt, actionName, action) {
    var numrows = 0;
    for(var i in evt.grid.selection) {
        var row = evt.grid.row(i);
        if (row.data._deletebulk_url === undefined) {
            numrows = 0;
            break;
        }
        numrows++;
    }
    if(numrows <= 1) {
        query(".grid" + actionName).forEach(function(item, idx) {
            domStyle.set(item, "display", "none");
        });
    } else {
        query(".grid" + actionName).forEach(function(item, idx) {
            domStyle.set(item, "display", "block");
        });
    }
}
""",
            'button_name': _('Delete'),
        },
        _('Activate'): {
            'on_click': onclick % (_('Activate'), '_activate_url'),
            'on_select_after': onselectafter % (
                'row.data._activate_url === undefined'
            ),
            'button_name': _('Activate'),
        },
        _('Rename'): {
            'on_click': onclick % (_('Rename'), '_rename_url'),
            'button_name': _('Rename'),
        },
        _('Keep'): {
            'on_click': onclick % (_('Keep'), '_keep_url'),
            'on_select_after': onselectafter % (
                'row.data._keep_url === undefined'
            ),
            'button_name': _('Keep'),
        },
        _('UnKeep'): {
            'on_click': onclick % (_('Unkeep'), '_un_keep_url'),
            'on_select_after': onselectafter % (
                'row.data._un_keep_url === undefined'
            ),
            'button_name': _('Unkeep'),
        },
    }
    return HttpResponse(
        json.dumps(actions),
        content_type='application/json',
    )


def bootenv_datagrid_structure(request):
    structure = OrderedDict((
        ('name', {'label': _('Name')}),
        ('active', {'label': _('Active')}),
        ('created', {'label': _('Created')}),
        ('keep', {'label': _('Keep')}),
    ))
    return HttpResponse(
        json.dumps(structure),
        content_type='application/json',
    )


def bootenv_activate(request, name):
    if request.method == 'POST':
        active = ActivateClone(name)
        if active is not False:
            return JsonResp(
                request,
                message=_('Boot Environment successfully activated.'),
            )
        return JsonResp(
            request,
            message=_('Failed to activate Boot Environment.'),
        )
    return render(request, 'system/bootenv_activate.html', {
        'name': name,
    })


def bootenv_add(request, source=None):
    if request.method == 'POST':
        form = forms.BootEnvAddForm(request.POST, source=source)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_('Boot Environment successfully added.'),
            )
        return JsonResp(request, form=form)
    else:
        form = forms.BootEnvAddForm(source=source)
    return render(request, 'system/bootenv_add.html', {
        'form': form,
        'source': source,
    })


def bootenv_scrub(request):
    if request.method == "POST":
        try:
            notifier().zfs_scrub('freenas-boot')
            return JsonResp(request, message=_("Scrubbing the Boot Pool..."))
        except Exception as e:
            return JsonResp(request, error=True, message=repr(e))
    return render(request, 'system/boot_scrub.html')


def bootenv_scrub_interval(request):
    assert request.method == 'POST'

    interval = request.POST.get('interval')
    if not interval.isdigit():
        return JsonResp(
            request,
            error=True,
            message=_('Interval must be an integer.'),
        )

    try:
        advanced = models.Advanced.objects.order_by('-id')[0]
    except:
        advanced = models.Advanced.objects.create()

    advanced.adv_boot_scrub = int(interval)
    advanced.save()

    notifier().restart("cron")

    return JsonResp(
        request,
        message=_('Scrub interval successfully changed.'),
    )


def bootenv_delete(request, name):
    if request.method == 'POST':
        delete = DeleteClone(name)
        if delete is not False:
            return JsonResp(
                request,
                message=_('Boot Environment successfully deleted.'),
            )
        return JsonResp(
            request,
            message=_('Failed to delete Boot Environment.'),
        )
    return render(request, 'system/bootenv_delete.html', {
        'name': name,
    })


def bootenv_deletebulk(request):
    names = request.GET.get('ids')
    if '/' in names or ' ' in names:
        raise ValueError("Invalid name")
    names = names.split(',')
    if request.method == 'POST':
        failed = False
        for i, name in enumerate(names):
            with open(BOOTENV_DELETE_PROGRESS, 'w') as f:
                f.write(json.dumps({
                    'current': name,
                    'index': i,
                    'total': len(names),
                }))
            delete = DeleteClone(name)
            if delete is False:
                failed = True
        if os.path.exists(BOOTENV_DELETE_PROGRESS):
            os.unlink(BOOTENV_DELETE_PROGRESS)
        if failed is False:
            return JsonResp(
                request,
                message=_('Boot Environments successfully deleted.'),
            )
        return JsonResp(
            request,
            message=_('Failed to delete Boot Environments.'),
        )
    return render(request, 'system/bootenv_deletebulk.html', {
        'names': names,
        'ids': request.GET.get('ids'),
    })


def bootenv_deletebulk_progress(request):

    if not os.path.exists(BOOTENV_DELETE_PROGRESS):
        return HttpResponse(
            json.dumps({'indeterminate': True}),
            content_type='application/json',
        )

    with open(BOOTENV_DELETE_PROGRESS, 'r') as f:
        data = f.read()

    try:
        data = json.loads(data)
        return HttpResponse(
            json.dumps({
                'indeterminate': False,
                'percent': int((data['index'] / float(data['total'])) * 100.0),
                'details': data['current'],
            }),
            content_type='application/json',
        )
    except:
        log.warn("Unable to load progress status for boot env bulk delete")

    return HttpResponse(
        json.dumps({'indeterminate': True}),
        content_type='application/json',
    )


def bootenv_rename(request, name):
    if request.method == 'POST':
        form = forms.BootEnvRenameForm(request.POST, name=name)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_('Boot Environment successfully renamed.'),
            )
        return JsonResp(request, form=form)
    else:
        form = forms.BootEnvRenameForm(name=name)
    return render(request, 'system/bootenv_rename.html', {
        'form': form,
        'name': name,
    })


def bootenv_keep(request, name):
    if request.method == 'POST':
        be = FindClone(name)
        keep = CloneSetAttr(be, keep=True)
        if keep:
            return JsonResp(
                request,
                message=_('Boot Environment successfully Kept.'),
            )
        return JsonResp(
            request,
            message=_('Failed to keep Boot Environment.'),
        )
    return render(request, 'system/bootenv_keep.html', {
        'name': name,
    })


def bootenv_unkeep(request, name):
    if request.method == 'POST':
        be = FindClone(name)
        keep = CloneSetAttr(be, keep=False)
        if keep:
            return JsonResp(
                request,
                message=_('Boot Environment successfully UnKept.'),
            )
        return JsonResp(
            request,
            message=_('Failed to Unkeep Boot Environment.'),
        )
    return render(request, 'system/bootenv_unkeep.html', {
        'name': name,
    })


def bootenv_pool_attach(request):
    label = request.GET.get('label')
    if request.method == 'POST':
        form = forms.BootEnvPoolAttachForm(request.POST, label=label)
        if form.is_valid():
            form.done()
            return JsonResp(
                request,
                message=_('Disk successfully attached.'),
            )
        return JsonResp(request, form=form)
    else:
        form = forms.BootEnvPoolAttachForm(label=label)
    return render(request, 'system/bootenv_pool_attach.html', {
        'form': form,
        'label': label,
    })


def bootenv_pool_detach(request, label):
    if request.method == 'POST':
        notifier().zfs_detach_disk('freenas-boot', label)
        return JsonResp(
            request,
            message=_("Disk has been successfully detached."))

    return render(request, 'system/bootenv_pool_detach.html', {
        'label': label,
    })


def bootenv_pool_replace(request, label):
    if request.method == 'POST':
        form = forms.BootEnvPoolReplaceForm(request.POST, label=label)
        if form.is_valid():
            form.done()
            return JsonResp(
                request,
                message=_('Disk is being replaced.'),
            )
        return JsonResp(request, form=form)
    else:
        form = forms.BootEnvPoolReplaceForm(label=label)
    return render(request, 'system/bootenv_pool_replace.html', {
        'form': form,
    })


def config_restore(request):
    if request.method == "POST":
        factory_restore(request)
        return render(request, 'system/config_ok2.html')
    return render(request, 'system/config_restore.html')


def config_upload(request):

    if request.method == "POST":
        form = forms.ConfigUploadForm(request.POST, request.FILES)

        variables = {
            'form': form,
        }

        if form.is_valid():
            success, errmsg = notifier().config_upload(request.FILES['config'])
            if not success:
                form._errors['__all__'] = \
                    form.error_class([errmsg])
                return JsonResp(request, form=form)
            else:
                request.session['allow_reboot'] = True
                return render(request, 'system/config_ok.html', variables)

        return render(request, 'system/config_upload.html', variables)
    else:
        FIRMWARE_DIR = '/var/tmp/firmware'
        if os.path.exists(FIRMWARE_DIR):
            if os.path.islink(FIRMWARE_DIR):
                os.unlink(FIRMWARE_DIR)
            if os.path.isdir(FIRMWARE_DIR):
                shutil.rmtree(FIRMWARE_DIR + '/')
        os.mkdir(FIRMWARE_DIR)
        os.chmod(FIRMWARE_DIR, 0o1777)
        form = forms.ConfigUploadForm()

        return render(request, 'system/config_upload.html', {
            'form': form,
        })


def config_save(request):

    if request.method == 'POST':
        form = forms.ConfigSaveForm(request.POST)
        if form.is_valid():
            return JsonResp(
                request,
                message=_("Config download is starting..."),
                events=['window.location="%s?secret=%s"' % (
                    reverse('system_configdownload'),
                    '1' if form.cleaned_data.get('secret') else '0'
                )]
            )
    else:
        form = forms.ConfigSaveForm()

    return render(request, 'system/config_save.html', {
        'form': form,
    })


def config_download(request):
    if request.GET.get('secret') == '0':
        filename = '/data/freenas-v1.db'
        bundle = False
    else:
        bundle = True
        filename = tempfile.mkstemp()[1]
        os.chmod(filename, 0o600)
        with tarfile.open(filename, 'w') as tar:
            tar.add('/data/freenas-v1.db', arcname='freenas-v1.db')
            tar.add('/data/pwenc_secret', arcname='pwenc_secret')

    wrapper = FileWrapper(file(filename))

    hostname = GlobalConfiguration.objects.all().order_by('-id')[0].gc_hostname
    freenas_build = "UNKNOWN"
    try:
        with open(VERSION_FILE) as d:
            freenas_build = d.read().strip()
    except:
        pass

    response = StreamingHttpResponse(
        wrapper, content_type='application/octet-stream'
    )
    response['Content-Length'] = os.path.getsize(filename)
    response['Content-Disposition'] = (
        'attachment; filename="%s-%s-%s.%s"' % (
            hostname,
            freenas_build,
            time.strftime('%Y%m%d%H%M%S'),
            'tar' if bundle else 'db',
        )
    )
    try:
        return response
    finally:
        if bundle:
            os.unlink(filename)


def reporting(request):
    return render(request, 'system/reporting.html')


def home(request):

    tabs = appPool.hook_app_tabs('system', request)
    tabs = sorted(tabs, key=lambda y: y['order'] if 'order' in y else 0)
    return render(request, 'system/index.html', {
        'focus_form': request.GET.get('tab', 'system.SysInfo'),
        'hook_tabs': tabs,
    })


def varlogmessages(request, lines):
    if lines is None:
        lines = 3
    msg = os.popen('tail -n %s /var/log/messages' % int(lines)).read().strip()
    # "\x07 is invalid XML CDATA, do below to escape it, as well as show some
    # indication of the "console bell" in the webconsole ui
    msg = msg.replace("\x07", "^G")
    return render(request, 'system/status/msg.xml', {
        'msg': msg,
    }, content_type='text/xml')


def top(request):
    top_pipe = os.popen('top')
    try:
        top_output = top_pipe.read()
    finally:
        top_pipe.close()
    return render(request, 'system/status/top.xml', {
        'focused_tab': 'system',
        'top': top_output,
    }, content_type='text/xml')


def reboot_dialog(request):
    if request.method == "POST":
        if notifier().zpool_scrubbing():
            if 'scrub_asked' not in request.session:
                request.session['scrub_asked'] = True
                return render(request, 'system/reboot_dialog2.html')
        request.session['allow_reboot'] = True
        return JsonResp(
            request,
            message=_("Reboot is being issued"),
            events=['window.location="%s"' % reverse('system_reboot')]
        )
    return render(request, 'system/reboot_dialog.html')


def reboot(request):
    """ reboots the system """
    if not request.session.get("allow_reboot"):
        return HttpResponseRedirect('/')
    request.session.pop("allow_reboot")
    return render(request, 'system/reboot.html', {
        'sw_name': get_sw_name(),
        'sw_version': get_sw_version(),
    })


def reboot_run(request):
    # We need to stop nginx right away to make sure
    # UI dont think we have rebooted while we have not.
    # This could happen if reboot takes too long to shutdown services.
    # See #19458
    # IMPORTANT: do not sync this change stopping the nginx service if
    # we are running on a TrueNAS HA system since that stops the nginx
    # on the soon-to-be master node too! see #20384
    _n = notifier()
    if not _n.is_freenas() and _n.failover_licensed():
        _n.stop("nginx", sync=False)
    else:
        _n.stop("nginx")
    _n.restart("system")
    return HttpResponse('OK')


def shutdown_dialog(request):
    if request.method == "POST":
        if notifier().zpool_scrubbing():
            if 'scrub_asked' not in request.session:
                request.session['scrub_asked'] = True
                return render(request, 'system/shutdown_dialog2.html')
        request.session['allow_shutdown'] = True
        return JsonResp(
            request,
            message=_("Shutdown is being issued"),
            events=['window.location="%s"' % reverse('system_shutdown')])
    return render(request, 'system/shutdown_dialog.html')


def shutdown(request):
    """ shuts down the system and powers off the system """
    if not request.session.get("allow_shutdown"):
        return HttpResponseRedirect('/')
    request.session.pop("allow_shutdown")
    return render(request, 'system/shutdown.html', {
        'sw_name': get_sw_name(),
        'sw_version': get_sw_version(),
    })


def shutdown_run(request):
    notifier().stop("system")
    return HttpResponse('OK')


def testmail(request):

    try:
        kwargs = dict(instance=models.Email.objects.order_by('-id')[0])
    except IndexError:
        kwargs = {}

    fromwizard = False
    data = request.POST.copy()
    for key, value in list(data.items()):
        if key.startswith('system-'):
            fromwizard = True
            data[key.replace('system-', '')] = value

    form = forms.EmailForm(data, **kwargs)
    if not form.is_valid():
        return JsonResp(request, form=form)

    if fromwizard:
        allfield = 'system-__all__'
    else:
        allfield = '__all__'

    if fromwizard:
        email = request.POST.get('system-sys_email')
        errmsg = _('You must provide a Root E-mail')
    else:
        email = bsdUsers.objects.get(bsdusr_username='root').bsdusr_email
        errmsg = _('You must configure the root email (Accounts->Users->root)')
    if not email:
        form.errors[allfield] = form.error_class([errmsg])

        return JsonResp(
            request,
            form=form,
        )

    sid = transaction.savepoint()
    form.save()

    error = False
    if request.is_ajax():
        sw_name = get_sw_name()
        error, errmsg = send_mail(
            subject=_('Test message from %s') % sw_name,
            text=_('This is a message test from %s') % sw_name,
            to=[email],
            timeout=10)
    if error:
        errmsg = _("Your test email could not be sent: %s") % errmsg
    else:
        errmsg = _('Your test email has been sent!')
    transaction.savepoint_rollback(sid)

    form.errors[allfield] = form.error_class([errmsg])
    return JsonResp(
        request,
        form=form,
    )


class DojoFileStore(object):

    def __init__(self, path, dirsonly=False, root="/", filterVolumes=True):
        self.root = os.path.abspath(str(root))
        self.filterVolumes = filterVolumes
        if self.filterVolumes:
            self.mp = [
                os.path.abspath('/mnt/%s' % v.vol_name)
                for v in Volume.objects.filter(vol_fstype='ZFS')
            ]

        self.path = os.path.join(self.root, path.replace("..", ""))
        self.path = os.path.abspath(self.path)
        # POSIX allows one or two initial slashes, but treats three or more
        # as single slash.
        if self.path.startswith('//'):
            self.path = self.path[1:]

        self.dirsonly = dirsonly
        if self.dirsonly:
            self._lookupurl = 'system_dirbrowser'
        else:
            self._lookupurl = 'system_filebrowser'

    def items(self):
        if self.path == self.root:
            return self.children(self.path)

        node = self._item(self.path, self.path)
        if node['directory']:
            node['children'] = self.children(self.path)
        return node

    def children(self, entry):
        _children = []
        if not os.path.exists(entry):
            return _children
        for _entry in sorted(os.listdir(entry)):
            # FIXME: better extendable way to exclude files
            if _entry.startswith(".") or _entry == 'md_size':
                continue
            full_path = os.path.join(self.path, _entry)
            if self.filterVolumes and len(
                [
                    f for f in self.mp if (
                        full_path.startswith(f + '/') or full_path == f or
                        full_path.startswith('/mnt')
                    )
                ]
            ) > 0:
                _children.append(self._item(self.path, _entry))
        if self.dirsonly:
            _children = [child for child in _children if child['directory']]
        return _children

    def _item(self, path, entry):
        full_path = os.path.join(path, entry)

        if full_path.startswith(self.root):
            path = full_path.replace(self.root, "/", 1)
        else:
            path = full_path

        if path.startswith("//"):
            path = path[1:]

        isdir = os.path.isdir(full_path)
        item = {
            'name': os.path.basename(full_path),
            'directory': isdir,
            'path': path,
        }
        if isdir:
            item['children'] = True

        item['$ref'] = os.path.abspath(
            reverse(self._lookupurl, kwargs={
                'path': path,
            }) + '?root=%s' % urllib.parse.quote_plus(self.root),
        )
        item['id'] = item['$ref']
        return item


def directory_browser(request, path='/'):
    """ This view provides the ajax driven directory browser callback """

    directories = DojoFileStore(
        path,
        dirsonly=True,
        root=request.GET.get("root", "/"),
    ).items()
    context = directories
    content = json.dumps(context)
    return HttpResponse(content, content_type='application/json')


def file_browser(request, path='/'):
    """ This view provides the ajax driven directory browser callback """

    directories = DojoFileStore(
        path,
        dirsonly=False,
        root=request.GET.get("root", "/"),
    ).items()
    context = directories
    content = json.dumps(context)
    return HttpResponse(content, content_type='application/json')


def manualupdate_progress(request):

    data = {}
    if os.path.exists(PGFILE):
        with open(PGFILE, 'r') as f:
            last = f.readlines()
            if last:
                step, percent = last[-1].split("|")
                data['step'] = int(step)
                percent = percent.strip()
                if percent:
                    data['percent'] = int(percent)
                else:
                    data['indeterminate'] = True
    elif os.path.exists(INSTALLFILE):
        data = {
            'step': 3,
            'indeterminate': True,
        }

    content = json.dumps(data)
    return HttpResponse(content, content_type='application/json')


def initialwizard_progress(request):
    data = {}
    if os.path.exists(forms.WIZARD_PROGRESSFILE):
        with open(forms.WIZARD_PROGRESSFILE, 'rb') as f:
            data = f.read()
        try:
            data = pickle.loads(data)
        except:
            data = {}
    content = json.dumps(data)
    return HttpResponse(content, content_type='application/json')


def restart_httpd(request):
    """ restart httpd """
    notifier().restart("http")
    return HttpResponse('OK')


def restart_httpd_all(request):
    """ restart nginx as well as django (evil)"""
    notifier().restart("http")
    notifier().restart("django")
    return HttpResponse('OK')


def reload_httpd(request):
    """ restart httpd """
    notifier().reload("http")
    return HttpResponse('OK')


def debug(request):

    _n = notifier()
    if request.method == 'GET':
        if not _n.is_freenas() and _n.failover_licensed():
            try:
                s = _n.failover_rpc()
                s.ping()
            except socket.error:
                return render(request, 'failover/failover_down.html')
        return render(request, 'system/debug.html')
    debug_generate()
    return render(request, 'system/debug_download.html')


def debug_download(request):
    mntpt, direc, dump = debug_get_settings()
    gc = GlobalConfiguration.objects.all().order_by('-id')[0]

    _n = notifier()
    if not _n.is_freenas() and _n.failover_licensed():
        debug_file = '%s/debug.tar' % direc
        extension = 'tar'
        hostname = ''
    else:
        debug_file = dump
        extension = 'tgz'
        hostname = '-%s' % gc.gc_hostname

    wrapper = FileWrapper(file(debug_file))
    response = StreamingHttpResponse(
        wrapper,
        content_type='application/octet-stream',
    )
    response['Content-Length'] = os.path.getsize(debug_file)
    response['Content-Disposition'] = \
        'attachment; filename=debug%s-%s.%s' % (
            hostname,
            time.strftime('%Y%m%d%H%M%S'),
            extension)

    return response


def backup(request):
    # Check if any backup is currently running
    backups = models.Backup.objects.all().order_by('-id')

    if len(backups) < 1 or backups[0].bak_acknowledged:
        # No backup is pending, can schedule next one

        if request.method == 'POST':
            backup_form = forms.BackupForm(request.POST)
            if backup_form.is_valid():
                backup = models.Backup()
                backup.bak_started_at = datetime.datetime.now()
                backup.save()
                transaction.commit()

                args = {
                    'cmd': 'START',
                    'hostport': backup_form.cleaned_data['backup_hostname'],
                    'username': backup_form.cleaned_data['backup_username'],
                    'password': backup_form.cleaned_data['backup_password'],
                    'directory': backup_form.cleaned_data['backup_directory'],
                    'with-data': backup_form.cleaned_data['backup_data'],
                    'compression': backup_form.cleaned_data['backup_compression'],
                    'use-keys': backup_form.cleaned_data['backup_auth_keys'],
                    'backup-id': backup.id
                }

                notifier().start('backup')
                response = notifier().call_backupd(args)

                if response['status'] != 'OK':
                    return JsonResp(request, error=True, message='Could not communicate with backup daemon')

                return render(request, 'system/backup_progress.html')
            else:
                return JsonResp(request, form=backup_form)

        backup_form = forms.BackupForm()
        return render(request, 'system/backup.html', {
            'form': backup_form
        })
    elif backups[0].bak_finished or backups[0].bak_failed:
        if request.method == 'POST':
            backups[0].bak_acknowledged = True
            backups[0].save()
            return JsonResp(request, message='Backup dismissed')

        return render(request, 'system/backup_acknowledge.html', {'backup': backups[0]})
    else:
        return render(request, 'system/backup_progress.html')


def backup_progress(request):
    # Check if any backup is currently running
    backup = models.Backup.objects.all().order_by('-id').first()

    if backup.bak_finished:
        data = {'status': 'finished', 'message': backup.bak_status}
        return HttpResponse(json.dumps(data), content_type='application/json')

    if backup.bak_failed:
        data = {'status': 'error', 'message': backup.bak_status}
        return HttpResponse(json.dumps(data), content_type='application/json')

    response = notifier().call_backupd({'cmd': 'PROGRESS'})
    if response['status'] != 'OK':
        data = {'status': 'error', 'message': 'Could not communicate with backup daemon'}
        return HttpResponse(json.dumps(data), content_type='application/json')

    data = {
        'status': 'running',
        'percent': response['percentage'],
        'message': response['message']
    }

    return HttpResponse(json.dumps(data), content_type='application/json')


def backup_abort(request):
    # Check if any backup is currently running
    backups = models.Backup.objects.all().order_by('-bak_started_at')

    if len(backups) < 1 or backups[0].bak_finished:
        pass

    if request.method == 'POST':
        # User wants to abort a backup
        response = notifier().call_backupd({'cmd': 'ABORT'})
        if response['status'] != 'OK':
            return redirect('/system/backup')

        return redirect('/system/backup')


class UnixTransport(xmlrpc.client.Transport):
    def make_connection(self, addr):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.connect(addr)
        self.sock.settimeout(5)
        return self.sock

    def single_request(self, host, handler, request_body, verbose=0):
        # issue XML-RPC request

        self.make_connection(host)

        try:
            self.sock.send(request_body + "\n")
            p, u = self.getparser()

            while 1:
                data = self.sock.recv(1024)
                if not data:
                    break
                p.feed(data)

            self.sock.close()
            p.close()

            return u.close()
        except xmlrpc.client.Fault:
            raise
        except Exception:
            # All unexpected errors leave connection in
            # a strange state, so we clear it.
            self.close()
            raise


class MyServer(xmlrpc.client.ServerProxy):

    def __init__(self, addr):

        self.__handler = "/"
        self.__host = addr
        self.__transport = UnixTransport()
        self.__encoding = None
        self.__verbose = 0
        self.__allow_none = 0

    def __request(self, methodname, params):
        # call a method on the remote server

        request = xmlrpc.client.dumps(
            params,
            methodname,
            encoding=self.__encoding,
            allow_none=self.__allow_none,
        )

        response = self.__transport.request(
            self.__host,
            self.__handler,
            request,
            verbose=self.__verbose
        )

        if len(response) == 1:
            response = response[0]

        return response

    def __getattr__(self, name):
        # magic method dispatcher
        return xmlrpc.client._Method(self.__request, name)


@never_cache
def terminal(request):

    sid = int(request.POST.get("s", 0))
    jid = request.POST.get("jid", 0)
    shell = request.POST.get("shell", "")
    k = request.POST.get("k")
    w = int(request.POST.get("w", 80))
    h = int(request.POST.get("h", 24))

    multiplex = MyServer("/var/run/webshell.sock")
    alive = False
    for i in range(3):
        try:
            alive = multiplex.proc_keepalive(sid, jid, shell, w, h)
            break
        except Exception as e:
            notifier().restart("webshell")
            time.sleep(0.5)

    try:
        if alive:
            if k:
                multiplex.proc_write(
                    sid,
                    xmlrpc.client.Binary(bytearray(k.encode('utf-8')))
                )
            time.sleep(0.002)
            content_data = '<?xml version="1.0" encoding="UTF-8"?>' + \
                multiplex.proc_dump(sid)
            response = HttpResponse(content_data, content_type='text/xml')
            return response
        else:
            response = HttpResponse('Disconnected')
            response.status_code = 400
            return response
    except (KeyError, ValueError, IndexError, xmlrpc.client.Fault) as e:
        response = HttpResponse('Invalid parameters: %s' % e)
        response.status_code = 400
        return response


def terminal_paste(request):
    return render(request, "system/terminal_paste.html")


def update_index(request):

    try:
        update = models.Update.objects.order_by('-id')[0]
    except IndexError:
        update = models.Update.objects.create()

    return render(request, 'system/update_index.html', {
        'update': update,
        'updateserver': Configuration.Configuration().UpdateServerURL(),
    })


def update_save(request):

    assert request.method == 'POST'

    try:
        update = models.Update.objects.order_by('-id')[0]
    except IndexError:
        update = models.Update.objects.create()

    if request.POST.get('autocheck'):
        if request.POST.get('autocheck') == 'true':
            update.upd_autocheck = True
        else:
            update.upd_autocheck = False
        update.save()
        notifier().restart("cron")

    if request.POST.get('train'):
        update.upd_train = request.POST.get('train')
        update.save()

    return HttpResponse(
        json.dumps(True),
        content_type='application/json',
    )


def update_apply(request):

    try:
        updateobj = models.Update.objects.order_by('-id')[0]
    except IndexError:
        updateobj = models.Update.objects.create()

    if request.method == 'POST':
        uuid = request.GET.get('uuid')
        if not uuid:

            # If it is HA run updated on the other node
            if not notifier().is_freenas() and notifier().failover_licensed():
                s = notifier().failover_rpc()
                uuid = s.updated(False, True)
                if uuid is False:
                    raise MiddlewareError(_('Update daemon failed!'))
                return HttpResponse(uuid, status=202)

            running = UpdateHandler.is_running()
            if running is not False:
                return HttpResponse(running, status=202)

            returncode, uuid = run_updated(
                str(updateobj.get_train()),
                str(notifier().get_update_location()),
                download=False,
                apply=True,
            )
            if returncode != 0:
                raise MiddlewareError(_('Update daemon failed!'))
            return HttpResponse(uuid, status=202)
        else:
            failover = False
            # Get update handler from standby node
            if not notifier().is_freenas() and notifier().failover_licensed():
                failover = True
                s = notifier().failover_rpc()
                rv = s.updated_handler(uuid)

                def exit():
                    pass

                rv['exit'] = exit
                handler = namedtuple('Handler', list(rv.keys()))(**rv)

            else:
                handler = UpdateHandler(uuid=uuid)
            if handler.error is not False:
                raise MiddlewareError(handler.error)
            if not handler.finished:
                return HttpResponse(handler.uuid, status=202)
            handler.exit()

            if failover:
                try:
                    s.reboot()
                except:
                    pass
                return render(request, 'failover/update_standby.html')
            else:
                if handler.reboot:
                    request.session['allow_reboot'] = True
                    return render(request, 'system/done.html')
                else:
                    return JsonResp(
                        request,
                        message=_('Update has been applied'),
                    )
    else:
        # If it is HA run update check on the other node
        if not notifier().is_freenas() and notifier().failover_licensed():
            try:
                s = notifier().failover_rpc()
                return render(
                    request,
                    'system/update.html',
                    s.update_check(),
                )
            except socket.error:
                return render(request, 'failover/failover_down.html')
        handler = CheckUpdateHandler()
        update = CheckForUpdates(
            diff_handler=handler.diff_call,
            handler=handler.call,
            train=updateobj.get_train(),
            cache_dir=notifier().get_update_location(),
        )
        changelog = None
        update_applied = False
        update_applied_msg = ''
        if update:
            update_version = update.Version()
            update_applied, update_applied_msg = is_update_applied(update_version)
            changelogpath = '%s/ChangeLog.txt' % (
                notifier().get_update_location()
            )
            conf = Configuration.Configuration()
            sys_mani = conf.SystemManifest()
            if sys_mani:
                sequence = sys_mani.Sequence()
            else:
                sequence = ''
            if os.path.exists(changelogpath):
                with open(changelogpath, 'r') as f:
                    changelog = parse_changelog(
                        f.read(),
                        start=sequence,
                        end=update.Sequence()
                    )
        return render(request, 'system/update.html', {
            'update': update,
            'update_applied': update_applied,
            'update_applied_msg': update_applied_msg,
            'handler': handler,
            'changelog': changelog,
        })


def update_check(request):

    try:
        updateobj = models.Update.objects.order_by('-id')[0]
    except IndexError:
        updateobj = models.Update.objects.create()

    if request.method == 'POST':
        uuid = request.GET.get('uuid')
        if not uuid:

            if request.POST.get('apply') == '1':
                apply_ = True
            else:
                apply_ = False

            # If it is HA run updated on the other node
            if not notifier().is_freenas() and notifier().failover_licensed():
                s = notifier().failover_rpc()
                uuid = s.updated(True, apply_)
                if uuid is False:
                    raise MiddlewareError(_('Update daemon failed!'))
                return HttpResponse(uuid, status=202)

            running = UpdateHandler.is_running()
            if running is not False:
                return HttpResponse(running, status=202)

            returncode, uuid = run_updated(
                str(updateobj.get_train()),
                str(notifier().get_update_location()),
                download=True,
                apply=apply_,
            )
            if returncode != 0:
                raise MiddlewareError(_('Update daemon failed!'))
            return HttpResponse(uuid, status=202)

        else:

            failover = False
            # Get update handler from standby node
            if not notifier().is_freenas() and notifier().failover_licensed():
                failover = True
                s = notifier().failover_rpc()
                rv = s.updated_handler(uuid)

                def exit():
                    pass

                rv['exit'] = exit
                handler = namedtuple('Handler', list(rv.keys()))(**rv)
            else:
                handler = UpdateHandler(uuid=uuid)
            if handler.error is not False:
                raise MiddlewareError(handler.error)
            if not handler.finished:
                return HttpResponse(handler.uuid, status=202)
            handler.exit()

            if handler.apply:
                if failover:
                    try:
                        s.reboot()
                    except:
                        pass
                    return render(request, 'failover/update_standby.html')

                if handler.reboot:
                    request.session['allow_reboot'] = True
                    return render(request, 'system/done.html')
                else:
                    return JsonResp(
                        request,
                        message=_('Update has been applied'),
                    )
            else:
                return JsonResp(
                    request,
                    message=_('Packages downloaded'),
                )
    else:
        # If it is HA run update check on the other node
        if not notifier().is_freenas() and notifier().failover_licensed():
            try:
                s = notifier().failover_rpc()
                return render(
                    request,
                    'system/update_check.html',
                    s.update_check(),
                )
            except socket.error:
                return render(request, 'failover/failover_down.html')

        handler = CheckUpdateHandler()
        error = None
        error_trace = None
        update_applied = False
        update_applied_msg = ''

        try:
            update = CheckForUpdates(
                diff_handler=handler.diff_call,
                handler=handler.call,
                train=updateobj.get_train(),
            )
            network = True
        except UpdateManifestNotFound:
            network = False
            update = False
            if sys.exc_info()[0]:
                error_trace = traceback.format_exc()
        except Exception as e:
            network = False
            update = False
            error = str(e)
            if sys.exc_info()[0]:
                error_trace = traceback.format_exc()
        if update:
            update_version = update.Version()
            update_applied, update_applied_msg = is_update_applied(update_version)

            conf = Configuration.Configuration()
            sys_mani = conf.SystemManifest()
            if sys_mani:
                sequence = sys_mani.Sequence()
            else:
                sequence = ''
            changelog = get_changelog(updateobj.get_train(), start=sequence, end=update.Sequence())
        else:
            changelog = None
        return render(request, 'system/update_check.html', {
            'update': update,
            'update_applied': update_applied,
            'update_applied_msg': update_applied_msg,
            'network': network,
            'handler': handler,
            'changelog': changelog,
            'error': error,
            'traceback': error_trace,
        })


def update_progress(request):

    # If it is HA run update handler on the other node
    if not notifier().is_freenas() and notifier().failover_licensed():
        s = notifier().failover_rpc()
        rv = s.updated_handler(None)
        load = rv['data']
    else:
        load = UpdateHandler().load()
    return HttpResponse(
        json.dumps(load),
        content_type='application/json',
    )


def update_verify(request):
    if request.method == 'POST':
        handler = VerifyHandler()
        try:
            log.debug("Starting VerifyUpdate")
            error_flag, ed, warn_flag, wl = Configuration.do_verify(handler.verify_handler)
        except Exception as e:
            log.debug("VerifyUpdate Exception ApplyUpdate: %s" % e)
            handler.error = str(e)
        handler.finished = True
        handler.dump()
        log.debug("VerifyUpdate finished!")
        if handler.error is not False:
            handler.exit()
            raise MiddlewareError(handler.error)
        handler.exit()
        if error_flag or warn_flag:
            checksums = None
            wrongtype = None
            notfound = None
            perms = None
            if ed['checksum']:
                checksums = ed['checksum']
            if ed['notfound']:
                notfound = ed['notfound']
            if ed['wrongtype']:
                wrongtype = ed['wrongtype']
            if warn_flag:
                perms = wl
            return render(request, 'system/update_verify.html', {
                'error': True,
                'checksums': checksums,
                'notfound': notfound,
                'wrongtype': wrongtype,
                'perms': perms,
            })
        else:
            return render(request, 'system/update_verify.html', {
                'success': True,
            })
    else:
        return render(request, 'system/update_verify.html')


def verify_progress(request):
    handler = VerifyHandler()
    return HttpResponse(
        json.dumps(handler.load()),
        content_type='application/json',
    )


def CA_import(request):

    if request.method == "POST":
        form = forms.CertificateAuthorityImportForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Certificate Authority successfully imported.")
            )

    else:
        form = forms.CertificateAuthorityImportForm()

    return render(request, "system/certificate/CA_import.html", {
        'form': form
    })


def CA_create_internal(request):

    if request.method == "POST":
        form = forms.CertificateAuthorityCreateInternalForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Internal Certificate Authority successfully created.")
            )

    else:
        form = forms.CertificateAuthorityCreateInternalForm()

    return render(request, "system/certificate/CA_create_internal.html", {
        'form': form
    })


def CA_create_intermediate(request):

    if request.method == "POST":
        form = forms.CertificateAuthorityCreateIntermediateForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Intermediate Certificate Authority successfully created.")
            )

    else:
        form = forms.CertificateAuthorityCreateIntermediateForm()

    return render(request, "system/certificate/CA_create_intermediate.html", {
        'form': form
    })


def CA_edit(request, id):

    ca = models.CertificateAuthority.objects.get(pk=id)

    if request.method == "POST":
        form = forms.CertificateAuthorityEditForm(request.POST, instance=ca)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Certificate Authority successfully edited.")
            )

    else:
        form = forms.CertificateAuthorityEditForm(instance=ca)

    return render(request, "system/certificate/CA_edit.html", {
        'form': form
    })


def buf_generator(buf):
    for line in buf:
        yield line


def CA_export_certificate(request, id):
    ca = models.CertificateAuthority.objects.get(pk=id)
    try:
        if ca.cert_chain:
            cert = export_certificate_chain(ca.cert_certificate)
        else:
            cert = export_certificate(ca.cert_certificate)
    except Exception as e:
        raise MiddlewareError(e)

    response = StreamingHttpResponse(
        buf_generator(cert), content_type='application/octet-stream'
    )
    response['Content-Length'] = len(cert)
    response['Content-Disposition'] = 'attachment; filename=%s.crt' % ca

    return response


def CA_export_privatekey(request, id):
    ca = models.CertificateAuthority.objects.get(pk=id)
    if not ca.cert_privatekey:
        return HttpResponse('No private key')

    key = export_privatekey(ca.cert_privatekey)
    response = StreamingHttpResponse(
        buf_generator(key), content_type='application/octet-stream'
    )
    response['Content-Length'] = len(key)
    response['Content-Disposition'] = 'attachment; filename=%s.key' % ca

    return response


def certificate_import(request):

    if request.method == "POST":
        form = forms.CertificateImportForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Certificate successfully imported.")
            )

    else:
        form = forms.CertificateImportForm()

    return render(request, "system/certificate/certificate_import.html", {
        'form': form
    })


def certificate_create_internal(request):

    if request.method == "POST":
        form = forms.CertificateCreateInternalForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Internal Certificate successfully created.")
            )

    else:
        form = forms.CertificateCreateInternalForm()

    return render(request, "system/certificate/certificate_create_internal.html", {
        'form': form
    })


def certificate_create_CSR(request):

    if request.method == "POST":
        form = forms.CertificateCreateCSRForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Certificate CSR successfully created.")
            )

    else:
        form = forms.CertificateCreateCSRForm()

    return render(request, "system/certificate/certificate_create_CSR.html", {
        'form': form
    })


def certificate_edit(request, id):

    cert = models.Certificate.objects.get(pk=id)

    if request.method == "POST":
        form = forms.CertificateEditForm(request.POST, instance=cert)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("Internal Certificate successfully edited.")
            )

    else:
        form = forms.CertificateEditForm(instance=cert)

    return render(request, "system/certificate/certificate_edit.html", {
        'form': form
    })


def CSR_edit(request, id):

    cert = models.Certificate.objects.get(pk=id)

    if request.method == "POST":
        form = forms.CertificateCSREditForm(request.POST, instance=cert)
        if form.is_valid():
            form.save()
            return JsonResp(
                request,
                message=_("CSR successfully edited.")
            )

    else:
        form = forms.CertificateCSREditForm(instance=cert)

    return render(request, "system/certificate/CSR_edit.html", {
        'form': form
    })


def certificate_export_certificate(request, id):
    c = models.Certificate.objects.get(pk=id)
    cert = export_certificate(c.cert_certificate)

    response = StreamingHttpResponse(
        buf_generator(cert), content_type='application/octet-stream'
    )
    response['Content-Length'] = len(cert)
    response['Content-Disposition'] = 'attachment; filename=%s.crt' % c

    return response


def certificate_export_privatekey(request, id):
    c = models.Certificate.objects.get(pk=id)
    if not c.cert_privatekey:
        return HttpResponse('No private key')
    key = export_privatekey(c.cert_privatekey)

    response = StreamingHttpResponse(
        buf_generator(key), content_type='application/octet-stream'
    )
    response['Content-Length'] = len(key)
    response['Content-Disposition'] = 'attachment; filename=%s.key' % c

    return response


# Need to figure this one out...
def certificate_export_certificate_and_privatekey(request, id):
    c = models.Certificate.objects.get(pk=id)

    export_certificate(c.cert_certificate)
    export_privatekey(c.cert_privatekey)

    response = StreamingHttpResponse(
        buf_generator(combined), content_type='application/octet-stream'
    )
    response['Content-Length'] = len(combined)
    response['Content-Disposition'] = 'attachment; filename=%s.p12' % c

    return response


def certificate_to_json(certtype):
    try:
        data = {
            'cert_root_path': certtype.cert_root_path,
            'cert_type': certtype.cert_type,
            'cert_certificate': certtype.cert_certificate,
            'cert_privatekey': certtype.cert_privatekey,
            'cert_CSR': certtype.cert_CSR,
            'cert_key_length': certtype.cert_key_length,
            'cert_digest_algorithm': certtype.cert_digest_algorithm,
            'cert_lifetime': certtype.cert_lifetime,
            'cert_country': certtype.cert_country,
            'cert_state': certtype.cert_state,
            'cert_city': certtype.cert_city,
            'cert_organization': certtype.cert_organization,
            'cert_email': certtype.cert_email,
            'cert_serial': certtype.cert_serial,
            'cert_internal': certtype.cert_internal,
            'cert_certificate_path': certtype.cert_certificate_path,
            'cert_privatekey_path': certtype.cert_privatekey_path,
            'cert_CSR_path': certtype.cert_CSR_path,
            'cert_issuer': certtype.cert_issuer,
            'cert_ncertificates': certtype.cert_ncertificates,
            'cert_DN': certtype.cert_DN,
            'cert_from': certtype.cert_from,
            'cert_until': certtype.cert_until,
            'cert_type_existing': certtype.cert_type_existing,
            'cert_type_internal': certtype.cert_type_internal,
            'cert_type_CSR': certtype.cert_type_CSR,
            'CA_type_existing': certtype.CA_type_existing,
            'CA_type_internal': certtype.CA_type_internal,
            'CA_type_intermediate': certtype.CA_type_intermediate,
        }

    except Exception as e:
        log.debug("certificate_to_json: caught exception: '%s'", e)

    try:
        data['cert_signedby'] = "%s" % certtype.cert_signedby
    except:
        data['cert_signedby'] = None

    content = json.dumps(data)
    return HttpResponse(content, content_type='application/json')


def CA_info(request, id):
    return certificate_to_json(
        models.CertificateAuthority.objects.get(pk=int(id))
    )


def certificate_info(request, id):
    return certificate_to_json(
        models.Certificate.objects.get(pk=int(id))
    )
