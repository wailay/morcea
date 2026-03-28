const SPREADSHEET_ID = "1Q-p5Tvjsundj1bJz41W3f9GZQxwp-XMVMty9YfNWtts";
const API_KEY = "AIzaSyCoc6Uot9x8ebdtd-QkMsd5RrwpRWQJ5G4";

/**
 * Append a new row to the waitlist spreadsheet
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} email
 */
export async function appendToWaitlist(firstName, lastName, email) {
  const today = new Date();
  const date = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  const values = [[firstName, lastName, email, "Waiting", date]];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:E:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Google Sheets error:", error);
    throw new Error("Failed to append to waitlist");
  }

  return response.json();
}
