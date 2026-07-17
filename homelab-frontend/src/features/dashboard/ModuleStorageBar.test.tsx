import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleStorageBar } from './ModuleStorageBar';
import type { ModuleStorageData } from '@app/types';

const mod = (id: string, name: string, storageGb: number): ModuleStorageData =>
  ({ id, name, storageGb } as ModuleStorageData);

describe('ModuleStorageBar', () => {
  it('renders an empty-state message when there is no storage at all', () => {
    render(<ModuleStorageBar coreStorageGb={0} modules={[]} />);
    expect(screen.getByText('No storage data available.')).toBeInTheDocument();
  });

  it('always shows the Homelab Core segment when core storage is present', () => {
    render(<ModuleStorageBar coreStorageGb={1} modules={[]} />);
    expect(screen.getByText('Homelab Core:')).toBeInTheDocument();
  });

  it('ignores modules with zero storage', () => {
    render(<ModuleStorageBar coreStorageGb={1} modules={[mod('a', 'Alpha', 0)]} />);
    expect(screen.queryByText('Alpha:')).not.toBeInTheDocument();
  });

  it('lists modules sorted by descending storage in the legend', () => {
    render(
      <ModuleStorageBar
        coreStorageGb={0}
        modules={[mod('a', 'Small', 0.5), mod('b', 'Big', 2)]}
      />,
    );
    expect(screen.getByText('Big:')).toBeInTheDocument();
    expect(screen.getByText('Small:')).toBeInTheDocument();
  });

  it('groups modules beyond the direct slots into an "Other (N)" segment', () => {
    // MAX_DIRECT_SLOTS is 8, so with core taking one slot, 7 modules are shown directly and
    // any beyond that are grouped. Provide 9 modules -> 7 direct + 2 grouped as "Other (2)".
    const modules = Array.from({ length: 9 }, (_, i) => mod(`m${i}`, `Mod${i}`, 9 - i));
    render(<ModuleStorageBar coreStorageGb={0} modules={modules} />);

    expect(screen.getByText('Other (2):')).toBeInTheDocument();
  });

  it('formats storage in MB with one decimal below 10 MB and no decimal above', () => {
    render(<ModuleStorageBar coreStorageGb={0} modules={[mod('a', 'A', 0.001), mod('b', 'B', 1)]} />);
    // 0.001 GB * 1024 = 1.024 MB -> "1.0 MB"; 1 GB * 1024 = 1024 MB -> "1024 MB"
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByText('1024 MB')).toBeInTheDocument();
  });
});
