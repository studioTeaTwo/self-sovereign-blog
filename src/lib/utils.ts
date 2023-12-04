import { format, parse } from 'date-fns';

export function displayDate(yyyymmdd: string) {
	const date = parse(yyyymmdd, 'yyyy-MM-dd', new Date());
	return format(date, 'MMM d, Y');
}
