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
import logging

from django.shortcuts import render

from freenasUI.freeadmin.apppool import appPool
from freenasUI.support.utils import fc_enabled

log = logging.getLogger('sharing.views')


def home(request):

    view = appPool.hook_app_index('sharing', request)
    view = [_f for _f in view if _f]
    if view:
        return view[0]

    tab = request.GET.get('tab', '')

    # Redirect from services node
    if tab == 'services.ISCSI':
        tab = 'sharing.ISCSI.iSCSITargetGlobalConfiguration'

    if tab.startswith('sharing.ISCSI'):
        ntab = 'sharing.ISCSI'
    else:
        ntab = ''

    return render(request, 'sharing/index.html', {
        'focus_form': tab,
        'ntab': ntab,
        'fc_enabled': fc_enabled(),
    })


def fc_ports(request):

    return render(request, 'sharing/fc_ports.html', {
    })
