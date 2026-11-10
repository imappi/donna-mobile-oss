import React, { useState } from 'react';
import { Button, Input, Row, Screen, Stack, Txt } from '../design';
import { formatNumericDate, parseNumericDate, t } from '../i18n';

/**
 * Log mileage — the + menu's third verb. Three fields, one loud action.
 * The backend records it and answers with a receipt (an FYI card lands in
 * Actions); the route shows the receipt and closes.
 *
 * The date is typed the way the owner's language writes it (9.11.2026 in
 * Finnish, 09/11/2026 in English) and sent as the contract's ISO date.
 * `defaultDate` is ISO.
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
  const [date, setDate] = useState(() => formatNumericDate(defaultDate));
  const [dateLeft, setDateLeft] = useState(false);
  const [purpose, setPurpose] = useState('');
  const parsed = parseNumericDate(date);
  const valid = Number(distance) > 0 && parsed.ok && purpose.trim().length > 0;
  const dateError = dateLeft && date.trim() && !parsed.ok
    ? parsed.reason === 'impossible'
      ? t('mileage.dateImpossible', { date: date.trim() })
      : t('mileage.dateFormat', { example: formatNumericDate(defaultDate) })
    : null;

  return (
    <Screen scroll onBack={onBack}>
      <Stack padX="screenX" gap="md">
        <Txt v="panel">{t('mileage.title')}</Txt>
        <Row gap="sm">
          <Input
            grow
            placeholder={t('mileage.distance')}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            editable={!busy}
          />
          <Button title="km" kind={unit === 'km' ? 'primary' : 'chip'} onPress={() => onToggleUnit('km')} />
          <Button title="mi" kind={unit === 'mi' ? 'primary' : 'chip'} onPress={() => onToggleUnit('mi')} />
        </Row>
        <Input
          placeholder={t('mileage.date')}
          accessibilityLabel={t('mileage.date')}
          value={date}
          onChangeText={(next) => {
            setDate(next);
            setDateLeft(false);
          }}
          onBlur={() => setDateLeft(true)}
          keyboardType="numbers-and-punctuation"
          editable={!busy}
        />
        {dateError ? (
          <Txt v="sm" tone="alert" accessibilityLiveRegion="polite">
            {dateError}
          </Txt>
        ) : null}
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
          onPress={() => parsed.ok && onSave({ date: parsed.iso, distance: Number(distance), purpose: purpose.trim() })}
        />
      </Stack>
    </Screen>
  );
};
