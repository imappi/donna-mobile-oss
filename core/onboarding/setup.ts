import type { BusinessSetup } from '../api';
import type { StringKey } from '../i18n';

/** Presentation only. The server chooses the next action and whether to show it. */
export const SETUP_SUGGESTIONS: Record<BusinessSetup['next_step'], { title: StringKey; body: StringKey; action: StringKey }> = {
  identify_business: { title: 'setup.lookupTitle', body: 'setup.lookupBenefit', action: 'setup.addBusinessId' },
  business_stage: { title: 'setup.stageTitle', body: 'setup.stageBenefit', action: 'setup.chooseStage' },
  prior_records: { title: 'setup.recordsTitle', body: 'setup.recordsBenefit', action: 'setup.addRecords' },
  first_receipt: { title: 'setup.firstTitle', body: 'setup.firstBenefit', action: 'setup.captureReceipt' },
  done: { title: 'setup.title', body: 'setup.readyBody', action: 'setup.open' }
};
