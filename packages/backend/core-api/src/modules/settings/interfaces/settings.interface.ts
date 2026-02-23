import {
  Auditable,
  SettingValue,
  WithCategory,
  WithDescription,
  WithId,
  WithIsActive,
  WithLabel,
  WithOptionalDescription,
  WithStringKey,
  WithValue
} from '@config/libs';

export interface SystemSetting
  extends WithId<number>, WithStringKey, WithValue, WithCategory, WithOptionalDescription, WithIsActive, Auditable<Date> {}

export interface SettingsUpdateRequest {
  settings: SettingValue[];
}

export interface SettingsResponse extends WithId<string>, WithLabel, WithDescription, WithValue<boolean>, WithCategory {}
