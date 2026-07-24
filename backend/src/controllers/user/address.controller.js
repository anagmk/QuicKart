import Address from "../../models/address.model.js";

const fields = [
  "name",
  "phone",
  "pincode",
  "locality",
  "address",
  "city",
  "state",
  "landmark",
  "alternatePhone",
  "addressType",
];

const addressData = (body) => Object.fromEntries(
  fields.map((field) => [field, typeof body[field] === "string" ? body[field].trim() : body[field]]),
);

const validateAddress = (data) => {
  const required = ["name", "phone", "pincode", "locality", "address", "city", "state"];
  const missing = required.find((field) => !data[field]);
  if (missing) return `${missing} is required`;
  if (!["Home", "Work"].includes(data.addressType || "Home")) return "Choose a valid address type";
  return null;
};

export const listAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({ addresses });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load addresses" });
  }
};

export const getAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) return res.status(404).json({ message: "Address not found" });
    return res.json({ address });
  } catch {
    return res.status(404).json({ message: "Address not found" });
  }
};

export const createAddress = async (req, res) => {
  try {
    const data = addressData(req.body);
    const validationError = validateAddress(data);
    if (validationError) return res.status(400).json({ message: validationError });

    const address = await Address.create({ ...data, user: req.user.id });
    return res.status(201).json({ message: "Address added successfully", address });
  } catch (error) {
    return res.status(500).json({ message: "Unable to add address" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const data = addressData(req.body);
    const validationError = validateAddress(data);
    if (validationError) return res.status(400).json({ message: validationError });

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true, runValidators: true },
    );
    if (!address) return res.status(404).json({ message: "Address not found" });
    return res.json({ message: "Address updated successfully", address });
  } catch {
    return res.status(404).json({ message: "Address not found" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!address) return res.status(404).json({ message: "Address not found" });
    return res.json({ message: "Address deleted successfully" });
  } catch {
    return res.status(404).json({ message: "Address not found" });
  }
};
