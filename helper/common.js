function randomString(length, isOTP = false) {
  let result = '';
  const characters = isOTP ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  let counter = 0;
  while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
      counter += 1;
  }
  return result;
}