import { Calendar, Badge } from "antd";
import dayjs from "dayjs";

export default function ProductAvailabilityCalendar({ bookings }: any) {

  const getListData = (value: any) => {
    const selectedDay = dayjs(value);
    return bookings.filter((b: any) => {
      const startDay = dayjs(b.startDate);
      const endDay = dayjs(b.endDate);
      return (
        selectedDay.isSame(startDay, "day") ||
        selectedDay.isSame(endDay, "day") ||
        (selectedDay.isAfter(startDay, "day") && selectedDay.isBefore(endDay, "day"))
      );
    });
  };

  const dateCellRender = (value: any) => {

    const listData = getListData(value);

    return (
      <ul>
        {listData.map((item: any) => (
          <li key={item._id}>
            <Badge status="error" text="Booked" />
          </li>
        ))}
      </ul>
    );
  };

  return <Calendar cellRender={dateCellRender} />;
}