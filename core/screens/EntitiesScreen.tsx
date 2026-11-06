import React from 'react';
import type { Entity } from '../api';
import { ListRow, Screen, SectionHeader } from '../design';
import { t } from '../i18n';

/**
 * The entity switcher — mounted only for owners with more than one set
 * of books. A plain list in the list grammar: the active book is stated
 * in words (trailing meta), never a tinted pill; picking one switches
 * and goes back. Adding/removing books is not a mobile job.
 */
export type EntitiesScreenProps = {
  entities: Entity[];
  activeEntityId: string;
  onPick: (entityId: string) => void;
  onBack: () => void;
};

/** entity_type is display-only and open-ended in the contract — label the known ones, stay silent otherwise. */
const typeLabel = (entityType: string | null | undefined): string | null => {
  if (entityType === 'sole_trader') return t('entities.type_sole_trader');
  if (entityType === 'limited_company') return t('entities.type_limited_company');
  return null;
};

export const EntitiesScreen = ({ entities, activeEntityId, onPick, onBack }: EntitiesScreenProps) => (
  <Screen title={t('entities.title')} onBack={onBack} scroll>
    <SectionHeader label={t('entities.section')} count={entities.length} first />
    {entities.map((entity) => (
      <ListRow
        key={entity.id}
        dot="none"
        title={entity.display_name}
        subtitle={typeLabel(entity.entity_type)}
        trailingMeta={entity.id === activeEntityId ? t('entities.current') : null}
        onPress={() => onPick(entity.id)}
      />
    ))}
  </Screen>
);
