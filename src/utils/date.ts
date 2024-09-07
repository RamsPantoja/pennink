import { DateTime } from "luxon";

const isDateExpired = (date: Date): boolean => {
  const currentDate = DateTime.now();
  const fromDate = DateTime.fromJSDate(date);
  return currentDate.diff(fromDate, "days").days > 0;
};

export { isDateExpired };
