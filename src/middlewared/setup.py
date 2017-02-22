from setuptools import setup


install_requires = [
    'ws4py',
    'python-dateutil',
    'falcon',
    'markdown',
    'Flask',
    #'setproctitle',
]

setup(
    name='middlewared',
    description='FreeNAS Middleware Daemon ',
    packages=[
        'middlewared',
        'middlewared.client',
        'middlewared.plugins',
        'middlewared.apidocs',
    ],
    package_data={
        'middlewared.apidocs': [
            'templates/websocket/*',
            'templates/*.*',
        ],
    },
    include_package_data=True,
    license='BSD',
    platforms='any',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
    ],
    install_requires=install_requires,
    entry_points={
        'console_scripts': [
            'middlewared = middlewared.main:main',
            'midclt = middlewared.client.client:main',
        ],
    },
)
