import { BidRound } from "@/types/bid_round_enum";
import { SettingKeys } from "@/types/program_settings_mappings";

export function getCurrentBidRound(settings: Record<string, { id: number; value: string }>): BidRound {

  const now = new Date();

  const round1Start = new Date(settings[SettingKeys.FIRST_ROUND_START_DATE]?.value || '');
  const round1End = new Date(settings[SettingKeys.FIRST_ROUND_END_DATE]?.value || '');
  const round2Start = new Date(settings[SettingKeys.SECOND_ROUND_START_DATE]?.value || '');
  const round2End = new Date(settings[SettingKeys.SECOND_ROUND_END_DATE]?.value || '');

  if (round1Start <= now && now <= round1End) {
    return BidRound.ROUND1;
  }

  if (round2Start <= now && now <= round2End) {
    return BidRound.ROUND2;
  }

  return BidRound.NOT_STARTED;
}
