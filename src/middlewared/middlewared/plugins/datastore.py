from middlewared.service import Service, private
from middlewared.schema import accepts, Bool, Dict, Int, List, Ref, Str

import os
import sys

sys.path.append('/usr/local/www')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freenasUI.settings')

import django
django.setup()

from django.apps import apps
from django.db import connection
from django.db.models import Q
from django.db.models.fields.related import ForeignKey

from middlewared.utils import django_modelobj_serialize


class DatastoreService(Service):

    def _filters_to_queryset(self, filters, field_suffix=None):
        opmap = {
            '=': 'exact',
            '!=': 'exact',
            '>': 'gt',
            '>=': 'gte',
            '<': 'lt',
            '<=': 'lte',
            '~': 'regex',
        }

        rv = []
        for f in filters:
            if not isinstance(f, (list, tuple)):
                raise ValueError('Filter must be a list: {0}'.format(f))
            if len(f) == 3:
                name, op, value = f
                if field_suffix:
                    name = field_suffix + name
                if op not in opmap:
                    raise Exception("Invalid operation: {0}".format(op))
                q = Q(**{'{0}__{1}'.format(name, opmap[op]): value})
                if op == '!=':
                    q.negate()
                rv.append(q)
            elif len(f) == 2:
                op, value = f
                if op == 'OR':
                    or_value = None
                    for value in self._filters_to_queryset(value, field_suffix=field_suffix):
                        if or_value is None:
                            or_value = value
                        else:
                            or_value |= value
                    rv.append(or_value)
                else:
                    raise ValueError('Invalid operation: {0}'.format(op))
            else:
                raise Exception("Invalid filter {0}".format(f))
        return rv

    def __get_model(self, name):
        """Helper method to get Model for given name
        e.g. network.interfaces -> Interfaces
        """
        app, model = name.split('.', 1)
        return apps.get_model(app, model)

    def __queryset_serialize(self, qs, extend=None, field_suffix=None):
        for i in qs:
            yield django_modelobj_serialize(self.middleware, i, extend=extend, field_suffix=field_suffix)

    @accepts(
        Str('name'),
        List('query-filters', register=True),
        Dict(
            'query-options',
            Str('extend'),
            Dict('extra', additional_attrs=True),
            List('order_by'),
            Bool('count'),
            Bool('get'),
            Str('suffix'),
            register=True,
        ),
    )
    def query(self, name, filters=None, options=None):
        """Query for items in a given collection `name`.

        `filters` is a list which each entry can be in one of the following formats:

            entry: simple_filter | conjuntion
            simple_filter: '[' attribute_name, OPERATOR, value ']'
            conjunction: '[' CONJUNTION, '[' simple_filter (',' simple_filter)* ']]'

            OPERATOR: ('=' | '!=' | '>' | '>=' | '<' | '<=' | '~' )
            CONJUNCTION: 'OR'

        e.g.

        `['OR', [ ['username', '=', 'root' ], ['uid', '=', 0] ] ]`

        `[ ['username', '=', 'root' ] ]`

        .. examples(websocket)::

          Querying for username "root" and returning a single item:

            :::javascript
            {
              "id": "d51da71b-bb48-4b8b-a8f7-6046fcc892b4",
              "msg": "method",
              "method": "datastore.query",
              "params": ["account.bsdusers", [ ["username", "=", "root" ] ], {"get": true}]
            }
        """
        model = self.__get_model(name)
        if options is None:
            options = {}
        else:
            # We do not want to make changes to original options
            # which might happen with "suffix"
            options = options.copy()

        qs = model.objects.all()

        extra = options.get('extra')
        if extra:
            qs = qs.extra(**extra)

        suffix = options.get('suffix')

        if filters:
            qs = qs.filter(*self._filters_to_queryset(filters, suffix))

        order_by = options.get('order_by')
        if order_by:
            if suffix:
                # Do not change original order_by
                order_by = order_by[:]
                for i, order in enumerate(order_by):
                    if order.startswith('-'):
                        order_by[i] = '-' + suffix + order[1:]
                    else:
                        order_by[i] = suffix + order
            qs = qs.order_by(*order_by)

        if options.get('count') is True:
            return qs.count()

        result = list(self.__queryset_serialize(
            qs, extend=options.get('extend'), field_suffix=options.get('suffix')
        ))

        if options.get('get') is True:
            return result[0]
        return result

    @accepts(Str('name'), Ref('query-options'))
    def config(self, name, options=None):
        """
        Get configuration settings object for a given `name`.

        This is a shortcut for `query(name, {"get": true})`.
        """
        if options is None:
            options = {}
        options['get'] = True
        return self.query(name, None, options)

    @accepts(Str('name'), Dict('data', additional_attrs=True))
    def insert(self, name, data):
        """
        Insert a new entry to `name`.
        """
        model = self.__get_model(name)
        for field in model._meta.fields:
            if field.name not in data:
                continue
            if isinstance(field, ForeignKey):
                data[field.name] = field.rel.to.objects.get(pk=data[field.name])
        obj = model(**data)
        obj.save()
        return obj.pk

    @accepts(Str('name'), Int('id'), Dict('data', additional_attrs=True))
    def update(self, name, id, data):
        """
        Update an entry `id` in `name`.
        """
        model = self.__get_model(name)
        obj = model.objects.get(pk=id)
        for field in model._meta.fields:
            if field.name not in data:
                continue
            if isinstance(field, ForeignKey):
                data[field.name] = field.rel.to.objects.get(pk=data[field.name])
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj.pk

    @accepts(Str('name'), Int('id'))
    def delete(self, name, id):
        """
        Delete an entry `id` in `name`.
        """
        model = self.__get_model(name)
        model.objects.get(pk=id).delete()
        return True

    @private
    def sql(self, query, params=None):
        cursor = connection.cursor()
        rv = None
        try:
            if params is None:
                cursor.executelocal(query)
            else:
                cursor.executelocal(query, params)
            rv = cursor.fetchall()
        finally:
            cursor.close()
        return rv
