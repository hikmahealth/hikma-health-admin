import { Group, Paper, rem, SimpleGrid, Text } from '@mantine/core';
import { createStyles } from '@mantine/emotion';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconForms,
  IconIdBadge,
  IconTimelineEvent,
  IconUserCircle,
  IconUserPlus,
} from '@tabler/icons-react';

const useStyles = createStyles((theme, _, u) => ({
  root: {
    paddingTop: `calc(${theme.spacing.xl} * 1.0)`,
    paddingBottom: `calc(${theme.spacing.xl} * 1.0)`,
  },

  value: {
    fontSize: rem(24),
    fontWeight: 700,
    lineHeight: 1,
  },

  diff: {
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  },

  icon: {
    [u.dark]: {
      color: theme.colors.dark[3],
    },
    [u.light]: {
      color: theme.colors.gray[4],
    },
  },

  title: {
    fontWeight: 700,
    textTransform: 'uppercase',
  },
}));

const icons = {
  user: IconIdBadge,
  event: IconTimelineEvent,
  patient: IconUserCircle,
  form: IconForms,
};

interface StatsGridProps {
  data: {
    title: string;
    icon: keyof typeof icons | 'user' | 'event' | 'patient' | 'form' | string;
    value: string;
    diff: number;
    description: string;
  }[];
}

export function DashboardStatsGrid({ data }: StatsGridProps) {
  const { classes } = useStyles();
  const stats = data.map((stat) => {
    const Icon = icons[stat.icon as keyof typeof icons] || IconUserPlus;
    const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

    return (
      <Paper withBorder p="md" radius="md" key={stat.title}>
        <Group justify="space-between">
          <Text size="xs" color="dimmed" className={classes.title}>
            {stat.title}
          </Text>
          <Icon className={classes.icon} size="1.4rem" stroke={1.5} />
        </Group>

        <Group align="flex-end" gap="xs" mt={25}>
          <Text className={classes.value}>{stat.value}</Text>
          {/* <Text color={stat.diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} className={classes.diff}>
            <span>{stat.diff}%</span>
            <DiffIcon size="1rem" stroke={1.5} />
          </Text>
           */}
        </Group>

        <Text fz="xs" c="dimmed" mt={7}>
          {stat.description}
        </Text>
      </Paper>
    );
  });
  return (
    <div className={classes.root}>
      <SimpleGrid
        cols={{
          base: 1,
          sm: 2,
          lg: 4,
        }}
        // breakpoints={[
        // { maxWidth: 'md', cols: 2 },
        // { maxWidth: 'xs', cols: 1 },
        // ]}
      >
        {stats}
      </SimpleGrid>
    </div>
  );
}
