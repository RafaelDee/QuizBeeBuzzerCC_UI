/** converts any string to a formal display-able format
 *
 * ex: awaiting_pickup -> Awaiting Pickup
 */
export function toFormalString(str: string) {
  return str
    .split('_')
    .map((word) => capitalizeFirstLetter(word))
    .join(' ');
}
export function replaceUndefinedWithNull(obj: any): any {
  if (obj === undefined) {
    return null;
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(replaceUndefinedWithNull);
  }

  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      if (obj[key] === undefined) {
        obj[key] = null;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = replaceUndefinedWithNull(obj[key]);
      }
    }
  }
  /* const result: { [key: string]: any } = {};
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      if (obj[key] === undefined) {
        result[key] = null;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = replaceUndefinedWithNull(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  } */
  return obj;
}
export const asyncDelay = (time) => new Promise((res) => setTimeout(res, time));
declare global {
  interface String {
    hashCode(): number;
    isEmpty: boolean;
  }
}
Object.defineProperty(String.prototype, 'isEmpty', {
  get: function () {
    return this?.trim().length == 0;
  },
  configurable: true,
  enumerable: false,
});
/* export function isTimestampType(obj: any): obj is Timestamp {
  return obj instanceof Timestamp || (!!obj && obj['nanoseconds'] != null && obj['seconds'] != null);
}
export function dateOrTimestamptoDate(date: Timestamp | Date): Date {
  let convertedDate;
  try {
    if (isTimestampType(date)) {
      convertedDate = new Timestamp(date['seconds'], date['nanoseconds']).toDate();
    } else {
      convertedDate = new Date(date);
    }
  } catch (err) {
    console.error(err);
    return null;
  }

  return convertedDate;
} */
export function extractClassProperties<T>(obj: Record<string, any>, classRef: new (...args: any[]) => T): Partial<T> {
  // Get an instance of the class to extract its properties
  const instance = new classRef('', 0);

  // Get the keys of the class instance
  const classProperties = Object.keys(instance);

  // Filter object keys to match class properties
  const extractedProperties: Partial<T> = {};
  classProperties.forEach((key) => {
    if (key in obj) {
      extractedProperties[key as keyof T] = obj[key];
    }
  });

  return extractedProperties;
}
export const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => i + min);
export function isEmpty(value: any): boolean {
  // Check for null or undefined
  if (value == null || value == undefined) {
    return true;
  }

  // Check for strings and arrays
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  // Check for objects
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return false;
    }
    return Object.keys(value).length === 0;
  }

  // For numbers, booleans, and functions, consider them non-empty
  return false;
}

String.prototype.hashCode = function () {
  var hash = 0,
    i,
    chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export function areObjectsEqual(obj1, obj2) {
  if (!obj1 || !obj2) {
    return obj1 == obj2;
  }
  // Get the keys of both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Check if the number of keys is the same
  if (keys1.length !== keys2.length) {
    return false;
  }

  // Iterate over the keys
  for (let key of keys1) {
    // Check if the current key exists in both objects
    if (!obj2.hasOwnProperty(key)) {
      return false;
    }

    // Compare the values of the current key
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  // All keys and values are equal
  return true;
}
