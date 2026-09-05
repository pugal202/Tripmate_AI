export type Airport = {
  id: string;
  iataCode: string;
  icaoCode: string;
  airportName: string;
  city: string;
  state: string;
  country: "India";
  latitude: number;
  longitude: number;
};

const airport = (iataCode: string, icaoCode: string, airportName: string, city: string, state: string, latitude: number, longitude: number): Airport => ({ id: iataCode, iataCode, icaoCode, airportName, city, state, country: "India", latitude, longitude });

export const indianAirports: Airport[] = [
  airport("BLR", "VOBL", "Kempegowda International Airport", "Bengaluru", "Karnataka", 13.1986, 77.7066),
  airport("BOM", "VABB", "Chhatrapati Shivaji Maharaj International Airport", "Mumbai", "Maharashtra", 19.0896, 72.8656),
  airport("DEL", "VIDP", "Indira Gandhi International Airport", "Delhi", "Delhi", 28.5562, 77.1),
  airport("HYD", "VOHS", "Rajiv Gandhi International Airport", "Hyderabad", "Telangana", 17.2313, 78.4299),
  airport("MAA", "VOMM", "Chennai International Airport", "Chennai", "Tamil Nadu", 12.9941, 80.1709),
  airport("CCU", "VECC", "Netaji Subhas Chandra Bose International Airport", "Kolkata", "West Bengal", 22.6547, 88.4467),
  airport("COK", "VOCI", "Cochin International Airport", "Kochi", "Kerala", 10.152, 76.4019),
  airport("GOI", "VOGA", "Manohar International Airport", "Goa", "Goa", 15.3808, 73.8314),
  airport("AMD", "VAAH", "Sardar Vallabhbhai Patel International Airport", "Ahmedabad", "Gujarat", 23.0772, 72.6347),
  airport("PNQ", "VAPO", "Pune Airport", "Pune", "Maharashtra", 18.5821, 73.9197),
  airport("JAI", "VIJP", "Jaipur International Airport", "Jaipur", "Rajasthan", 26.8242, 75.8122),
  airport("LKO", "VILK", "Chaudhary Charan Singh International Airport", "Lucknow", "Uttar Pradesh", 26.7606, 80.8893),
  airport("GAU", "VEGT", "Lokpriya Gopinath Bordoloi International Airport", "Guwahati", "Assam", 26.1061, 91.5859),
  airport("BBI", "VEBS", "Biju Patnaik International Airport", "Bhubaneswar", "Odisha", 20.2444, 85.8178),
  airport("IXC", "VICG", "Chandigarh International Airport", "Chandigarh", "Chandigarh", 30.6735, 76.7885),
  airport("TRV", "VOTV", "Trivandrum International Airport", "Thiruvananthapuram", "Kerala", 8.4821, 76.9201),
  airport("IXM", "VOMD", "Madurai Airport", "Madurai", "Tamil Nadu", 9.8345, 78.0934),
  airport("IXE", "VOML", "Mangaluru International Airport", "Mangaluru", "Karnataka", 12.9613, 74.8901),
  airport("PAT", "VEPT", "Jay Prakash Narayan Airport", "Patna", "Bihar", 25.5913, 85.088),
  airport("VNS", "VEBN", "Lal Bahadur Shastri International Airport", "Varanasi", "Uttar Pradesh", 25.4524, 82.8593),
  airport("SXR", "VISR", "Srinagar International Airport", "Srinagar", "Jammu and Kashmir", 33.9871, 74.7742),
  airport("ATQ", "VIAR", "Sri Guru Ram Dass Jee International Airport", "Amritsar", "Punjab", 31.7096, 74.7973),
  airport("NAG", "VANP", "Dr. Babasaheb Ambedkar International Airport", "Nagpur", "Maharashtra", 21.0922, 79.0472),
  airport("IDR", "VAID", "Devi Ahilya Bai Holkar Airport", "Indore", "Madhya Pradesh", 22.7218, 75.8011),
  airport("RPR", "VARP", "Swami Vivekananda Airport", "Raipur", "Chhattisgarh", 21.1804, 81.7388),
  airport("BDQ", "VABO", "Vadodara Airport", "Vadodara", "Gujarat", 22.3362, 73.2263),
  airport("STV", "VASU", "Surat Airport", "Surat", "Gujarat", 21.1141, 72.7418),
  airport("UDR", "VAUD", "Maharana Pratap Airport", "Udaipur", "Rajasthan", 24.6177, 73.8961),
  airport("IXB", "VEBD", "Bagdogra Airport", "Siliguri", "West Bengal", 26.6812, 88.3286),
  airport("VTZ", "VOVZ", "Visakhapatnam International Airport", "Visakhapatnam", "Andhra Pradesh", 17.7212, 83.2245),
  airport("VGA", "VOBZ", "Vijayawada International Airport", "Vijayawada", "Andhra Pradesh", 16.5304, 80.7968),
  airport("TRZ", "VOTR", "Tiruchirappalli International Airport", "Tiruchirappalli", "Tamil Nadu", 10.7654, 78.7097),
  airport("CJB", "VOCB", "Coimbatore International Airport", "Coimbatore", "Tamil Nadu", 11.03, 77.0434),
  airport("IXJ", "VIJU", "Jammu Airport", "Jammu", "Jammu and Kashmir", 32.6891, 74.8374),
  airport("DED", "VIDN", "Dehradun Airport", "Dehradun", "Uttarakhand", 30.1897, 78.1803),
  airport("IXR", "VERC", "Birsa Munda Airport", "Ranchi", "Jharkhand", 23.3143, 85.3217),
  airport("JDH", "VIJO", "Jodhpur Airport", "Jodhpur", "Rajasthan", 26.2511, 73.0489),
  airport("DIB", "VEMN", "Dibrugarh Airport", "Dibrugarh", "Assam", 27.4839, 95.0169),
  airport("IMF", "VEIM", "Imphal International Airport", "Imphal", "Manipur", 24.7601, 93.8967),
  airport("IXA", "VEAT", "Maharaja Bir Bikram Airport", "Agartala", "Tripura", 23.887, 91.2404),
  airport("IXZ", "VOPB", "Veer Savarkar International Airport", "Port Blair", "Andaman and Nicobar Islands", 11.6412, 92.7297),
  airport("CNN", "VOKN", "Kannur International Airport", "Kannur", "Kerala", 11.9186, 75.5472),
  airport("BHO", "VABP", "Raja Bhoj Airport", "Bhopal", "Madhya Pradesh", 23.2875, 77.3374),
  airport("IXL", "VILH", "Kushok Bakula Rimpochee Airport", "Leh", "Ladakh", 34.1359, 77.5465),
];

export function searchIndianAirports(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return indianAirports;
  return indianAirports.filter((item) => [item.iataCode, item.icaoCode, item.airportName, item.city, item.state].some((value) => value.toLowerCase().includes(term)));
}

export const airportByCode = (code: string) => indianAirports.find((airport) => airport.iataCode === code.toUpperCase());
