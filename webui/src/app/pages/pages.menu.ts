export const PAGES_MENU = [
  {
    path: 'pages',
    children: [
      {
        path: 'dashboard',
        data: {
          menu: {
            title: 'Dashboard',
            icon: 'ion-android-home',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
      {
        path: 'users',
        data: {
          menu: {
            title: 'Users',
            icon: 'ion-person',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
      {
        path: 'groups',
        data: {
          menu: {
            title: 'Groups',
            icon: 'ion-person-stalker',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
      {
        path: 'interfaces',
        data: {
          menu: {
            title: 'Interfaces',
            icon: 'ion-network',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
      {
        path: 'volumes',
        data: {
          menu: {
            title: 'Volumes',
            icon: 'ion-cube',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
    ]
  }
];
