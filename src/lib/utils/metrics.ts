import { IUser } from "../../models/User";

export function bmi(userData: IUser): number | null {
  if (!userData.healthProfile) return null;
  if (!userData.healthProfile.current_weight_kg) return null;
  if (!userData.healthProfile.height_cm) return null;

  let height_m = userData.healthProfile.height_cm / 100;
  let height_square = height_m * height_m;
  let weight = userData.healthProfile.current_weight_kg;

  const bmi = weight / height_square;

  return bmi;
}

export function bmr(userData: IUser): number | null {
  if (!userData.healthProfile) return null;
  if (!userData.healthProfile.current_weight_kg) return null;
  if (!userData.healthProfile.height_cm) return null;
  if (!userData.healthProfile.gender) return null;
  if (!userData.healthProfile.birth_date) return null;

  let height_cm = userData.healthProfile.height_cm ;
  let weight = userData.healthProfile.current_weight_kg;
  let age = getYearDifference(userData.healthProfile.birth_date, new Date());
  let gender = userData.healthProfile.gender;
  let bmr = (10*weight)+(6.25*height_cm)-(5*age);
  if(gender=="male")
  {
    bmr+=5;
  }else{
    bmr-=161;
  }

  return bmr;
}



export function getYearDifference(date1: Date, date2: Date): number {
  // Ensure date1 is the earlier date for consistent results
  if (date1 > date2) {
    [date1, date2] = [date2, date1]; // Swap if date1 is later
  }

  const year1 = date1.getFullYear();
  const year2 = date2.getFullYear();

  let yearDiff = year2 - year1;

  // Adjust for cases where the later date's month/day is before the earlier date's month/day
  // For example, Jan 1, 2025 and Dec 31, 2024 should be 0 years difference, not 1.
  if (
    date2.getMonth() < date1.getMonth() ||
    (date2.getMonth() === date1.getMonth() && date2.getDate() < date1.getDate())
  ) {
    yearDiff--;
  }

  return yearDiff;
}
