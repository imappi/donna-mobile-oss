import React, { useState } from 'react';
import { Button, Input, Row, Screen, Stack, Txt } from '../design';
import { formatNumber, formatNumericDate, parseDecimal, parseNumericDate, t } from '../i18n';

/**
 * Log mileage — the + menu's third verb. Three fields, one loud action.
 * The backend records it and answers with a receipt (an FYI card lands in
 * Actions); the route shows the receipt and closes.
 *
 * The date and distance are typed the way the owner's language writes them
 * (9.11.2026 and 12,5 in Finnish, 09/11/2026 and 12.5 in English) and sent
 * as the contract's ISO date and JSON number. `defaultDate` is ISO.
 *
 * A failed save is a flag, not text: the screen says one plain catalog
 * sentence and the technical reason never reaches it (DESIGN.md §2).
 */
export type MileageScreenProps = {
  busy: boolean;
  failed?: boolean;
  defaultDate: string;
  unit: 'km' | 'mi';
  onToggleUnit: (unit: 'km' | 'mi') => void;
  onSave: (input: { date: string; distance: number; purpose: string }) => void;
  onBack?: () => void;
};

export const MileageScreen = ({ busy, failed, defaultDate, unit, onToggleUnit, onSave, onBack }: MileageScreenProps) => {
  const [distance, setDistance] = useState('');
  const [distanceLeft, setDistanceLeft] = useState(false);
  const [date, setDate] = useState(() => formatNumericDate(defaultDate));
  const [dateLeft, setDateLeft] = useState(false);
  const [purpose, setPurpose] = useState('');
  const parsed = parseNumericDate(date);
  const km = parseDecimal(distance);
  const valid = km.ok && km.value > 0 && parsed.ok && purpose.trim().length > 0;
  const distanceError = distanceLeft && distance.trim()
    ? !km.ok
      ? t('mileage.distanceFormat', { example: formatNumber(12.5) })
      : km.value > 0 ? null : t('mileage.distancePositive')
    : null;
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
            accessibilityLabel={t('mileage.distance')}
            onChangeText={(next) => {
              setDistance(next);
              setDistanceLeft(false);
            }}
            onBlur={() => setDistanceLeft(true)}
            keyboardType="decimal-pad"
            editable={!busy}
          />
          <Button title="km" kind={unit === 'km' ? 'primary' : 'chip'} onPress={() => onToggleUnit('km')} />
          <Button title="mi" kind={unit === 'mi' ? 'primary' : 'chip'} onPress={() => onToggleUnit('mi')} />
        </Row>
        {distanceError ? (
          <Txt v="sm" tone="alert" accessibilityLiveRegion="polite">
            {distanceError}
          </Txt>
        ) : null}
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
        {failed ? (
          <Txt v="sm" tone="alert" accessibilityLiveRegion="polite">
            {t('mileage.saveError')}
          </Txt>
        ) : null}
        <Button
          title={t('mileage.save')}
          kind="primary"
          size="large"
          loading={busy}
          disabled={!valid}
          onPress={() => valid && km.ok && parsed.ok && onSave({ date: parsed.iso, distance: km.value, purpose: purpose.trim() })}
        />
      </Stack>
    </Screen>
  );
};
