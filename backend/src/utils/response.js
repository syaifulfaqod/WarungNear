export const formatResponse = (success, dataOrMessage) => {
  if (success) {
    return { success: true, data: dataOrMessage };
  }
  return { success: false, message: dataOrMessage };
};
