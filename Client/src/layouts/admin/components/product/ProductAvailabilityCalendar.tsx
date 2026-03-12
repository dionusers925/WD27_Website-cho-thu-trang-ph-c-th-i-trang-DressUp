import { Calendar, Badge } from "antd";
import dayjs from "dayjs";

export default function ProductAvailabilityCalendar({ bookings }: any) {

  const getListData = (value: any) => {

    return bookings.filter((b: any) =>
      dayjs(value).isBetween(b.startDate, b.endDate, "day", "[]")
    );
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