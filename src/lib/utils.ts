import { env } from "~/env"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type MapSkeletonsProps = {
  numberOfSkeletons: number
  skeleton: JSX.Element
}

export const mapSkeletons = ({ numberOfSkeletons, skeleton }: MapSkeletonsProps) => {
  const skeletons: JSX.Element[] = [];

  for (let index = 0; index < numberOfSkeletons; index++) {
    skeletons.push(skeleton);
  }

  return skeletons
}

export const getPublicBaseUrl = () => {
  if (env.NEXT_PUBLIC_BASE_URL) return env.NEXT_PUBLIC_BASE_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

type Operation = 'add' | 'subtract';

export const operateHours = (
  time1: string,
  time2: string,
  operation: Operation
): string => {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  if (hours1 !== undefined && minutes1 !== undefined && hours2 !== undefined && minutes2 !== undefined) {
    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;

    let resultMinutes: number;

    if (operation === 'add') {
      resultMinutes = totalMinutes1 + totalMinutes2;
    } else if (operation === 'subtract') {
      resultMinutes = totalMinutes1 - totalMinutes2;
    } else {
      throw new Error("Invalid operation. Use 'add' or 'subtract'.");
    }

    if (resultMinutes < 0) {
      resultMinutes = (24 * 60 + resultMinutes) % (24 * 60);
    } else {
      resultMinutes = resultMinutes % (24 * 60);
    }

    const resultHours = Math.floor(resultMinutes / 60);
    const resultRemainingMinutes = resultMinutes % 60;

    const formattedHours = String(resultHours).padStart(2, '0');
    const formattedMinutes = String(resultRemainingMinutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
  } else {
    return "00:00";
  }
};

export const compareHours = (time1: string, time2: string): number | null => {

// returns  -1 if the first time is earlier than the second time,
// 1 if the first time is later than the second time,
// 0 if both times are equal.

  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  if (hours1 !== undefined && minutes1 !== undefined && hours2 !== undefined && minutes2 !== undefined) {
    if (hours1 < hours2 || (hours1 === hours2 && minutes1 < minutes2)) {
      return -1;
    } else if (hours1 > hours2 || (hours1 === hours2 && minutes1 > minutes2)) {
      return 1;
    } else {
      return 0;
    }
  } else {
    return null
  }
};
