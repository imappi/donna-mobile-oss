import React, { useState } from 'react';
import { Button, Input, Row, Screen, Stack, Txt } from '../design';
import { t } from '../i18n';

/**
 * Log mileage — the + menu's third verb. Three fields, one loud action.
 * The backend records it and answers with a receipt (an FYI card lands in
 * Actions); the route shows the receipt and closes.
 */
export type MileageScreenProps = {
  busy: boolean;
  error?: string | null;
  defaultDate: string;
  unit: 'km' | 'mi';
  onToggleUnit: (unit: 'km' | 'mi') => void;
  onSave: (input: { date: string; distance: number; purpose: string }) => void;
  onBack?: () => void;
};

export const MileageScreen = ({ busy, error, defaultDate, unit, onToggleUnit, onSave, onBack }: MileageScreenProps) => {
  const [distance, setDistance] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [purpose, setPurpose] = useState('');
  const valid = Number(distance) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && purpose.trim().length > 0;

  return (
    <Screen scroll onBack={onBack}>
      <Stack padX="screenX" gap="md">
        <Txt v="panel">{t('mileage.title')}</Txt>
        <Row gap="sm">
          <Input
            placeholder={t('mileage.distance')}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            editable={!busy}
          />
          <Button title="km" kind={unit === 'km' ? 'primary' : 'chip'} onPress={() => onToggleUnit('km')} />
          <Button title="mi" kind={unit === 'mi' ? 'primary' : 'chip'} onPress={() => onToggleUnit('mi')} />
        </Row>
        <Input placeholder={t('mileage.date')} value={date} onChangeText={setDate} editable={!busy} />
        <Input
          placeholder={t('mileage.purpose')}
          value={purpose}
          onChangeText={setPurpose}
          multiline
          editable={!busy}
        />
        {error ? (
          <Txt v="sm" tone="alert">
            {error}
          </Txt>
        ) : null}
        <Button
          title={t('mileage.save')}
          kind="primary"
          size="large"
          loading={busy}
          disabled={!valid}
          onPress={() => onSave({ date, distance: Number(distance), purpose: purpose.trim() })}
        />
      </Stack>
    </Screen>
  );
};
