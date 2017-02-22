#+
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
import json
import logging
import re

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import capfirst

log = logging.getLogger('freeadmin.models.fields')


class DictField(models.Field):
    empty_strings_allowed = False

    def get_internal_type(self):
        return "TextField"

    def get_db_prep_value(self, value, connection, prepared=False):
        if not value:
            value = {}
        return json.dumps(value)

    def from_db_value(self, value, expression, connection, context):
        return self.to_python(value)

    def to_python(self, value):
        if not value:
            return {}
        if isinstance(value, str):
            return json.loads(value)
        return value


class UserField(models.CharField):
    def __init__(self, *args, **kwargs):
        self._exclude = kwargs.pop('exclude', [])
        kwargs['max_length'] = kwargs.get('max_length', 120)
        super(UserField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        #FIXME: Move to top (causes cycle-dependency)
        from freenasUI.freeadmin.forms import UserField as UF
        defaults = {'form_class': UF, 'exclude': self._exclude}
        kwargs.update(defaults)
        return super(UserField, self).formfield(**kwargs)


class GroupField(models.CharField):
    def formfield(self, **kwargs):
        #FIXME: Move to top (causes cycle-dependency)
        from freenasUI.freeadmin.forms import GroupField as GF
        defaults = {'form_class': GF}
        kwargs.update(defaults)
        return super(GroupField, self).formfield(**kwargs)


class PathField(models.CharField):

    description = "A generic path chooser"

    def __init__(self, *args, **kwargs):
        self.abspath = kwargs.pop("abspath", True)
        self.includes = kwargs.pop("includes", [])
        self.dirsonly = kwargs.pop("dirsonly", True)
        self.filesonly = kwargs.pop("filesonly", False)
        kwargs['max_length'] = 255
        if kwargs.get('blank', False):
            kwargs['null'] = True
        super(PathField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        #FIXME: Move to top (causes cycle-dependency)
        from freenasUI.freeadmin.forms import PathField as PF
        defaults = {
            'form_class': PF,
            'abspath': self.abspath,
            'includes': self.includes,
            'dirsonly': self.dirsonly,
            'filesonly': self.filesonly,
        }
        kwargs.update(defaults)
        return super(PathField, self).formfield(**kwargs)


class MACField(models.Field):
    empty_strings_allowed = False

    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 17
        super(MACField, self).__init__(*args, **kwargs)

    def get_internal_type(self):
        return "CharField"

    def formfield(self, **kwargs):
        from freenasUI.freeadmin.forms import MACField as MF
        defaults = {'form_class': MF}
        defaults.update(kwargs)
        return super(MACField, self).formfield(**defaults)

    def to_python(self, value):
        if value:
            return value.replace(':', '')
        return value

    def get_db_prep_value(self, value, connection, prepared=False):
        if value:
            return re.sub(r'(?P<du>[0-9A-F]{2})(?!$)', '\g<du>:', value)
        return value


class MultiSelectField(models.Field):

    def get_internal_type(self):
        return "CharField"

    def get_choices_default(self):
        return self.get_choices(include_blank=False)

    def _get_FIELD_display(self, field):
        value = getattr(self, field.attname)
        choicedict = dict(field.choices)

    def formfield(self, **kwargs):
        from freenasUI.freeadmin.forms import SelectMultipleField
        defaults = {
            'required': not self.blank,
            'label': capfirst(self.verbose_name),
            'help_text': self.help_text,
            'choices': self.get_choices(include_blank=False),
        }
        if self.has_default():
            if isinstance(self.default, list):
                defaults['initial'] = self.default or []
            else:
                defaults['initial'] = self.default.split(',') or []
        defaults.update(kwargs)
        return SelectMultipleField(**defaults)

    def get_prep_value(self, value):
        return '' if value is None else ",".join(value)

    def get_db_prep_value(self, value, connection, prepared=False):
        if isinstance(value, str):
            return value
        elif isinstance(value, list):
            return ','.join(value)

    def from_db_value(self, value, expression, connection, context):
        if isinstance(value, str):
            if value:
                return value.split(',')
            else:
                return []
        elif isinstance(value, list):
            return value

    def to_python(self, value):
        if isinstance(value, list):
            return value
        if value in ('', None):
            return []
        return value.split(',')

    def validate(self, value, model_instance):
        if isinstance(value, list):
            valid_choices = [k for k, v in self.choices]
            for choice in value:
                if choice not in valid_choices:
                    raise ValidationError(
                        self.error_messages['invalid_choice'] % {
                            'value': choice
                        }
                    )

    def contribute_to_class(self, cls, name):
        super(MultiSelectField, self).contribute_to_class(cls, name)
        if self.choices:
            func = lambda self, fieldname=name, choicedict=dict(
                self.choices
            ): ','.join([
                choicedict.get(value, value)
                for value in getattr(self, fieldname)
            ])
            setattr(cls, 'get_%s_display' % self.name, func)

    def get_choices_selected(self, arr_choices=''):
        if not arr_choices:
            return False
        list = []
        for choice_selected in arr_choices:
            list.append(choice_selected[0])
        return list

    def value_to_string(self, obj):
        value = self._get_val_from_obj(obj)
        return self.get_db_prep_value(value)


class Network4Field(models.CharField):

    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 18  # 255.255.255.255/32
        super(Network4Field, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        #FIXME: Move to top (causes cycle-dependency)
        from freenasUI.freeadmin.forms import Network4Field as NF
        defaults = {'form_class': NF}
        kwargs.update(defaults)
        return super(Network4Field, self).formfield(**kwargs)


class Network6Field(models.CharField):

    def __init__(self, *args, **kwargs):
        # ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128
        kwargs['max_length'] = 43
        super(Network6Field, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        #FIXME: Move to top (causes cycle-dependency)
        from freenasUI.freeadmin.forms import Network6Field as NF
        defaults = {'form_class': NF}
        kwargs.update(defaults)
        return super(Network6Field, self).formfield(**kwargs)
