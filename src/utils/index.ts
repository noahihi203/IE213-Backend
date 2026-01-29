import _ from "lodash"
import { Types } from "mongoose";

/**
 * Chuyển đổi string thành ObjectId của MongoDB
 * @param id - ID dạng string cần chuyển đổi
 * @returns ObjectId tương ứng
 * @example convertToObjectIdMongodb("507f1f77bcf86cd799439011") => ObjectId("507f1f77bcf86cd799439011")
 */
const convertToObjectIdMongodb = (id: string) => new Types.ObjectId(id);

/**
 * Lọc và chỉ lấy các trường cần thiết từ object (dùng lodash.pick)
 * Thường dùng để loại bỏ các trường nhạy cảm như password khi trả về response
 * @param fields - Mảng các tên trường cần lấy
 * @param object - Object nguồn cần lọc
 * @returns Object mới chỉ chứa các trường được chỉ định
 * @example getInfoData({ fields: ["_id", "email"], object: user }) => { _id: "123", email: "test@email.com" }
 */
const getInfoData = ({
  fields = [],
  object = {},
}: {
  fields: string[];
  object: object;
}) => {
  return _.pick(object, fields);
};

/**
 * Tạo object select projection cho MongoDB query (chỉ lấy các trường được chọn)
 * @param select - Mảng các tên trường cần lấy
 * @returns Object với các trường có giá trị 1 (include)
 * @example getSelectData(["username", "email"]) => { username: 1, email: 1 }
 */
const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]));
};

/**
 * Tạo object select projection để loại trừ các trường không muốn lấy
 * @param select - Mảng các tên trường cần loại trừ
 * @returns Object với các trường có giá trị 0 (exclude)
 * @example unGetSelectData(["password"]) => { password: 0 }
 */
const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 0]));
};

/**
 * Xóa các trường có giá trị null khỏi object
 * Thường dùng khi update document để tránh ghi đè các trường bằng null
 * @param obj - Object cần xử lý
 * @returns Object đã loại bỏ các trường null
 * @example removeUndefinedNullObject({ name: "John", age: null }) => { name: "John" }
 */
const removeUndefinedNullObject = (obj: { [x: string]: any }) => {
  Object.keys(obj).forEach((k) => {
    if (obj[k] === null) {
      delete obj[k];
    }
  });
  return obj;
};

/**
 * Chuyển đổi nested object thành dạng dot notation cho MongoDB update
 * Giúp update một phần của nested object mà không ghi đè toàn bộ
 * @param obj - Nested object cần chuyển đổi
 * @returns Object với key dạng dot notation
 * @example updateNestedObjectParser({ attributes: { color: "red" } }) => { "attributes.color": "red" }
 */
const updateNestedObjectParser = (obj: { [x: string]: any }) => {
  const final: { [x: string]: any } = {};
  Object.keys(obj).forEach((k) => {
    if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      const response = updateNestedObjectParser(obj[k]);
      Object.keys(response).forEach((a) => {
        final[`${k}.${a}`] = response[a];
      });
    } else {
      final[k] = obj[k];
    }
  });
  return final;
};

export {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedNullObject,
  convertToObjectIdMongodb,
};
