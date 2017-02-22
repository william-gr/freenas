from django.utils.translation import ugettext as _

from freenasUI.api.resources import (
    FibreChannelToTargetResourceMixin,
    FTPResourceMixin, ISCSIPortalResourceMixin, ISCSITargetResourceMixin,
    ISCSITargetGroupsResourceMixin,
    ISCSITargetExtentResourceMixin, ISCSITargetToExtentResourceMixin,
    NFSResourceMixin, ServicesResourceMixin
)
from freenasUI.freeadmin.options import BaseFreeAdmin
from freenasUI.freeadmin.site import site
from freenasUI.services import models


class ServicesFAdmin(BaseFreeAdmin):

    resource_mixin = ServicesResourceMixin


class FibreChannelToTargetFAdmin(BaseFreeAdmin):

    resource_mixin = FibreChannelToTargetResourceMixin


class FTPFAdmin(BaseFreeAdmin):

    resource_mixin = FTPResourceMixin
    deletable = False
    icon_model = "FTPIcon"
    advanced_fields = (
        'ftp_filemask',
        'ftp_dirmask',
        'ftp_fxp',
        'ftp_ident',
        'ftp_passiveportsmin',
        'ftp_passiveportsmax',
        'ftp_localuserbw',
        'ftp_localuserdlbw',
        'ftp_anonuserbw',
        'ftp_anonuserdlbw',
        'ftp_tls',
        'ftp_tls_policy',
        'ftp_tls_opt_allow_client_renegotiations',
        'ftp_tls_opt_allow_dot_login',
        'ftp_tls_opt_allow_per_user',
        'ftp_tls_opt_common_name_required',
        'ftp_tls_opt_enable_diags',
        'ftp_tls_opt_export_cert_data',
        'ftp_tls_opt_no_cert_request',
        'ftp_tls_opt_no_empty_fragments',
        'ftp_tls_opt_no_session_reuse_required',
        'ftp_tls_opt_stdenvvars',
        'ftp_tls_opt_dns_name_required',
        'ftp_tls_opt_ip_address_required',
        'ftp_ssltls_certfile',
        'ftp_options',
    )


class ISCSITargetFAdmin(BaseFreeAdmin):

    delete_form = "TargetExtentDelete"
    menu_child_of = "sharing.ISCSI"
    icon_object = "TargetIcon"
    icon_model = "TargetIcon"
    icon_add = "AddTargetIcon"
    icon_view = "ViewAllTargetsIcon"
    inlines = [
        {
            'form': 'iSCSITargetGroupsForm',
            'prefix': 'targetgroups_set',
            'formset': 'iSCSITargetGroupsInlineFormSet',
        },
    ]

    exclude_fields = (
        'id',
        'iscsi_target_mode',
    )
    nav_extra = {'order': 10}

    resource_mixin = ISCSITargetResourceMixin


class ISCSITargetGroupsFAdmin(BaseFreeAdmin):
    icon_model = 'SettingsIcon'
    resource_mixin = ISCSITargetGroupsResourceMixin


class ISCSIPortalFAdmin(BaseFreeAdmin):

    menu_child_of = "sharing.ISCSI"
    icon_object = "PortalIcon"
    icon_model = "PortalIcon"
    icon_add = "AddPortalIcon"
    icon_view = "ViewAllPortalsIcon"
    inlines = [
        {
            'form': 'iSCSITargetPortalIPForm',
            'prefix': 'portalip_set',
        },
    ]
    nav_extra = {'order': -5}

    resource_mixin = ISCSIPortalResourceMixin

    def get_datagrid_columns(self):
        columns = super(ISCSIPortalFAdmin, self).get_datagrid_columns()
        columns.insert(1, {
            'name': 'iscsi_target_portal_ips',
            'label': _('Listen'),
            'sortable': False,
        })
        return columns


class ISCSIAuthCredentialFAdmin(BaseFreeAdmin):

    menu_child_of = "sharing.ISCSI"
    icon_object = "AuthorizedAccessIcon"
    icon_model = "AuthorizedAccessIcon"
    icon_add = "AddAuthorizedAccessIcon"
    icon_view = "ViewAllAuthorizedAccessIcon"

    exclude_fields = (
        'id',
        'iscsi_target_auth_secret',
        'iscsi_target_auth_peersecret',
    )
    nav_extra = {'order': 5}

    resource_name = 'services/iscsi/authcredential'


class ISCSITargetToExtentFAdmin(BaseFreeAdmin):

    delete_form = "TargetExtentDelete"
    menu_child_of = "sharing.ISCSI"
    icon_object = "TargetExtentIcon"
    icon_model = "TargetExtentIcon"
    icon_add = "AddTargetExtentIcon"
    icon_view = "ViewAllTargetExtentsIcon"
    nav_extra = {'order': 20}

    resource_mixin = ISCSITargetToExtentResourceMixin


class ISCSITargetExtentFAdmin(BaseFreeAdmin):

    delete_form = "ExtentDelete"
    menu_child_of = "sharing.ISCSI"
    icon_object = "ExtentIcon"
    icon_model = "ExtentIcon"
    icon_add = "AddExtentIcon"
    icon_view = "ViewAllExtentsIcon"
    nav_extra = {'order': 15}

    resource_mixin = ISCSITargetExtentResourceMixin

    exclude_fields = (
        'id',
        'iscsi_target_extent_filesize',
        'iscsi_target_extent_naa',
        'iscsi_target_extent_legacy',
    )


class NFSFAdmin(BaseFreeAdmin):

    resource_mixin = NFSResourceMixin
    deletable = False
    icon_model = 'NFSIcon'


site.register(models.FibreChannelToTarget, FibreChannelToTargetFAdmin)
site.register(models.FTP, FTPFAdmin)
site.register(models.iSCSITarget, ISCSITargetFAdmin)
site.register(models.iSCSITargetGroups, ISCSITargetGroupsFAdmin)
site.register(models.iSCSITargetPortal, ISCSIPortalFAdmin)
site.register(models.iSCSITargetAuthCredential, ISCSIAuthCredentialFAdmin)
site.register(models.iSCSITargetToExtent, ISCSITargetToExtentFAdmin)
site.register(models.iSCSITargetExtent, ISCSITargetExtentFAdmin)
site.register(models.NFS, NFSFAdmin)
site.register(models.services, ServicesFAdmin)
