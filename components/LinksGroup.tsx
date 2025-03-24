import { Box, Collapse, Group, rem, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { createStyles } from '@mantine/emotion';
import { IconCalendarStats, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import If from './If';

const useStyles = createStyles((theme, _, u) => ({
  control: {
    fontWeight: 500,
    display: 'block',
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    [u.dark]: {
      color: theme.colors.dark[0],
      '&:hover': {
        backgroundColor: theme.colors.dark[7],
        color: theme.white,
      },
    },
    [u.light]: {
      color: theme.black,
      '&:hover': {
        backgroundColor: theme.colors.gray[0],
        color: theme.black,
      },
    },
    fontSize: theme.fontSizes.sm,
  },

  link: {
    fontWeight: 500,
    display: 'block',
    textDecoration: 'none',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    paddingLeft: rem(31),
    marginLeft: rem(30),
    fontSize: theme.fontSizes.sm,
    [u.dark]: {
      color: theme.colors.dark[0],
      borderLeft: theme.colors.dark[4],
      '&:hover': {
        backgroundColor: theme.colors.dark[7],
        color: theme.white,
      },
    },
    [u.light]: {
      color: theme.colors.gray[7],
      borderLeft: theme.colors.gray[3],
      '&:hover': {
        backgroundColor: theme.colors.gray[0],
        color: theme.black,
      },
    },
    // color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
    // borderLeft: `${rem(1)} solid ${
    // theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    // }`,

    // '&:hover': {
    // [u.dark]: {},
    // [u.light]: {},
    // backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
    // color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    // },
  },

  chevron: {
    transition: 'transform 200ms ease',
  },
}));

interface LinksGroupProps {
  icon: React.FC;
  label: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
  link?: string;
}

export function LinksGroup({ icon: Icon, label, initiallyOpened, links, link }: LinksGroupProps) {
  const { classes, theme } = useStyles();
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);
  const ChevronIcon = IconChevronRight;
  const items = (hasLinks ? links : []).map((link) => (
    <Link href={link.link} key={link.label} legacyBehavior>
      <Text component="a" className={classes.link} href={link.link}>
        {link.label}
      </Text>
    </Link>
  ));

  // wrapper that wraps in Link tag if the link prop is provided
  const Wrapper = ({ children }: any) => {
    if (link) {
      return (
        <Link href={link} legacyBehavior>
          {children}
        </Link>
      );
    }

    return children;
  };

  return (
    <>
      <UnstyledButton onClick={() => setOpened((o) => !o)} className={classes.control}>
        <Wrapper>
          <Group justify="space-between" gap={0}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={30}>
                {/* @ts-expect-error size error */}
                <Icon size="1.1rem" />
              </ThemeIcon>
              <Box ml="md">{label}</Box>
            </Box>
            <If show={hasLinks}>
              <If show={!opened}>
                <ChevronIcon className={classes.chevron} size="1rem" stroke={1.5} />
              </If>
              <If show={opened}>
                <IconChevronDown className={classes.chevron} size="1rem" stroke={1.5} />
              </If>
            </If>
          </Group>
        </Wrapper>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}

const mockdata = {
  label: 'Releases',
  icon: IconCalendarStats,
  links: [
    { label: 'Upcoming releases', link: '/' },
    { label: 'Previous releases', link: '/' },
    { label: 'Releases schedule', link: '/' },
  ],
};

export function NavbarLinksGroup() {
  return (
    <Box
      sx={(theme) => ({
        minHeight: rem(220),
        padding: theme.spacing.md,
        // backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
      })}
    >
      <LinksGroup {...mockdata} />
    </Box>
  );
}
