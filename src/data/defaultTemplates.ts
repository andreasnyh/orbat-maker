import type { Template } from '../types'

export const defaultTemplates: Template[] = [
  {
    id: 'default-section',
    name: 'Infantry Section (8-man)',
    description: 'Standard ARMA 3 infantry section with two fireteams',
    isDefault: true,
    groups: [
      {
        id: 'default-section-charlie',
        name: 'Charlie',
        slots: [
          { id: 'default-section-charlie-pm', roleLabel: 'Pointman' },
          { id: 'default-section-charlie-ic', roleLabel: 'IC' },
          { id: 'default-section-charlie-gren', roleLabel: 'Grenadier' },
          { id: 'default-section-charlie-ar', roleLabel: 'Auto Rifleman (Minimi)' },
        ],
      },
      {
        id: 'default-section-delta',
        name: 'Delta',
        slots: [
          { id: 'default-section-delta-dm', roleLabel: 'Designated Marksman' },
          { id: 'default-section-delta-2ic', roleLabel: '2IC' },
          { id: 'default-section-delta-med', roleLabel: 'Team Medic' },
          { id: 'default-section-delta-ar', roleLabel: 'Auto Rifleman (GPMG)' },
        ],
      },
    ],
  },
  {
    id: 'default-weapons',
    name: 'Weapons Team (4-man)',
    description: 'MMG or MAT weapons team',
    isDefault: true,
    groups: [
      {
        id: 'default-weapons-team',
        name: 'Weapons Team',
        slots: [
          { id: 'default-weapons-tl', roleLabel: 'Team Leader' },
          { id: 'default-weapons-g', roleLabel: 'Gunner' },
          { id: 'default-weapons-ag', roleLabel: 'Asst. Gunner' },
          { id: 'default-weapons-ab', roleLabel: 'Ammo Bearer' },
        ],
      },
    ],
  },
  {
    id: 'default-vehicle',
    name: 'Vehicle Crew (3-man)',
    description: 'Standard vehicle crew',
    isDefault: true,
    groups: [
      {
        id: 'default-vehicle-crew',
        name: 'Vehicle Crew',
        slots: [
          { id: 'default-vehicle-cdr', roleLabel: 'Commander' },
          { id: 'default-vehicle-dvr', roleLabel: 'Driver' },
          { id: 'default-vehicle-gnr', roleLabel: 'Gunner' },
        ],
      },
    ],
  },
]
