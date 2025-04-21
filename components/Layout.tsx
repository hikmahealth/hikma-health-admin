import {
  AppShell,
  Burger,
  Loader,
  rem,
  ScrollArea,
  Text,
  // Navbar,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { createStyles } from '@mantine/emotion';
import {
  IconAdjustments,
  IconBuildingHospital,
  IconCalendarStats,
  IconChartInfographic,
  IconDoorExit,
  IconForms,
  IconGauge,
  IconHaze,
  IconHomeCog,
  IconMedicineSyrup,
  IconNotes,
  IconUsers,
} from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuthStatus } from '../hooks/useUser';
import { LinksGroup } from './LinksGroup';

const navLinks = [
  { label: 'Dashboard', icon: IconGauge, link: '/app' },
  {
    label: 'Patients',
    icon: IconNotes,
    initiallyOpened: true,
    links: [
      { label: 'Patients List', link: '/app/patients/list' },
      { label: 'Register New Patient', link: '/app/patients/register' },
      { label: 'Customize Registration Form', link: '/app/patients/registration-form' },
    ],
  },
  {
    label: 'Users',
    icon: IconUsers,
    initiallyOpened: true,
    links: [
      { label: 'Users List', link: '/app/users-list' },
      { label: 'New User', link: '/app/new-user' },
    ],
  },
  // clinics
  {
    label: 'Clinics',
    icon: IconBuildingHospital,
    initiallyOpened: true,
    links: [
      { label: 'Clinics List', link: '/app/clinics-list' },
      { label: 'New Clinic', link: '/app/new-clinic' },
    ],
  },
  // Appointments
  {
    label: 'Appointments',
    icon: IconCalendarStats,
    initiallyOpened: true,
    links: [{ label: 'Appointments List', link: '/app/appointments/list' }],
  },
  // Prescriptions
  {
    label: 'Prescriptions',
    icon: IconMedicineSyrup,
    initiallyOpened: true,
    links: [{ label: 'Prescriptions List', link: '/app/prescriptions/list' }],
  },
  { label: 'Forms', icon: IconForms, link: '/app/forms-list' },
  // { label: 'HERS', icon: IconHaze, link: '/app/hers' },
  { label: 'Activate App', icon: IconHaze, link: '/app/app-register-code' },
  // { label: 'Reports (Beta)', icon: IconFileReport, link: '/app/reports' },
  { label: 'Raw Data / Export Events', icon: IconAdjustments, link: '/app/exports' },
  { label: 'Data Explorer', icon: IconChartInfographic, link: '/app/data-explorer' },
  { label: 'Settings', icon: IconHomeCog, link: '/app/settings' },
];

const useStyles = createStyles((theme, _, u) => ({
  navbar: {
    [u.dark]: {
      backgroundColor: theme.colors.dark[6],
    },
    [u.light]: {
      backgroundColor: theme.white,
    },
    paddingBottom: 0,
  },

  links: {
    marginLeft: `calc(${theme.spacing.md} * -1)`,
    marginRight: `calc(${theme.spacing.md} * -1)`,
  },

  linksInner: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },

  footer: {
    marginLeft: `calc(${theme.spacing.md} * -1)`,
    marginRight: `calc(${theme.spacing.md} * -1)`,
    [u.dark]: {
      borderTop: `${rem(1)} solid ${theme.colors.dark[4]}`,
    },
    [u.light]: {
      borderTop: `${rem(1)} solid ${theme.colors.gray[3]}`,
    },
  },
}));

type Props = {
  children: React.ReactNode;
  title: string;
  isLoading?: boolean;
};

export default function AppLayout(props: Props) {
  const router = useRouter();
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const { classes } = useStyles();
  const { children = false, title, isLoading } = props;

  const currentPath = router.pathname;

  const { loadingAuth, authenticated } = useAuthStatus();
  useEffect(() => {
    if (!authenticated && !loadingAuth) {
      console.log({ authenticated, loadingAuth });
      router.replace('/');
    }
  }, [authenticated, loadingAuth]);

  const confirmSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const links = navLinks.map((item) => <LinksGroup {...item} key={item.label} />);
  return (
    <AppShell
      padding="md"
      styles={(theme, _, u) => ({
        main: {
          [u.dark]: {
            background: theme.colors.dark[8],
          },
          [u.light]: {
            background: theme.colors.gray[0],
          },
        },
      })}
      // navbarOffsetBreakpoint="sm"
      // asideOffsetBreakpoint="sm"
      navbar={{
        width: { sm: 200, lg: 300 },
        breakpoint: 'md',
        collapsed: { mobile: !opened, desktop: currentPath.includes('explorer') ? !opened : false },
      }}
      header={{ height: { base: 50, md: 70 } }}
    >
      <AppShell.Header p="md">
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
            size="sm"
            // hiddenFrom="md"
            color={theme.colors.gray[6]}
            mr="xl"
          />

          <Text fz="xl">Hikma Health Admin</Text>
        </div>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow className={classes.links} component={ScrollArea}>
          <div className={classes.linksInner}>
            {links}
            <div onClick={confirmSignOut}>
              <LinksGroup icon={IconDoorExit} label="Sign Out" />
            </div>
          </div>
        </AppShell.Section>

        <AppShell.Section className={classes.footer}>{/* <User /> */}</AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        <Title order={1}>{title}</Title>
        {isLoading ? (
          <div className="flex justify-center my-6 w-full">
            <Loader size="xl" />
          </div>
        ) : (
          children
        )}
      </AppShell.Main>
    </AppShell>
  );
}

// export function User() {
//   const theme = useMantineTheme();

//   return (
//     <Box
//       sx={{
//         paddingTop: theme.spacing.sm,
//         borderTop: `${rem(1)} solid ${
//           theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]
//         }`,
//       }}
//     >
//       <UnstyledButton
//         sx={{
//           display: 'block',
//           width: '100%',
//           padding: theme.spacing.xs,
//           borderRadius: theme.radius.sm,
//           color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,

//           '&:hover': {
//             backgroundColor:
//               theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
//           },
//         }}
//       >
//         <Group>
//           <Avatar
//             src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=255&q=80"
//             radius="xl"
//           />
//           <Box sx={{ flex: 1 }}>
//             <Text size="sm" weight={500}>
//               Amy Horsefighter
//             </Text>
//             <Text color="dimmed" size="xs">
//               ahorsefighter@gmail.com
//             </Text>
//           </Box>

//           {theme.dir === 'ltr' ? (
//             <IconChevronRight size={rem(18)} />
//           ) : (
//             <IconChevronLeft size={rem(18)} />
//           )}
//         </Group>
//       </UnstyledButton>
//     </Box>
//   );
// }
