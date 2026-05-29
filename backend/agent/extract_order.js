const AIRPORT_ALIASES = [
  { code: "HND", aliases: ["haneda", "hnd", "羽田", "aeropuerto de haneda"] },
  { code: "NRT", aliases: ["narita", "nrt", "成田", "aeropuerto de narita"] },
  { code: "KIX", aliases: ["kansai", "kix", "関西", "关西", "aeropuerto de kansai"] },
  { code: "CTS", aliases: ["new chitose", "cts", "新千歳", "新千岁", "nuevo chitose", "aeropuerto de new chitose"] },
];

const DESTINATION_ALIASES = [
  { value: "Shinjuku / Tokyo 23 Wards", aliases: ["shinjuku", "新宿"] },
  { value: "Tokyo 23 Wards", aliases: ["tokyo", "tokyo 23", "tokyo station", "shinkansen", "tokyo city", "tokio", "东京", "東京", "东京23", "東京23", "东京站", "東京駅", "新干线", "新幹線", "shibuya", "渋谷", "涩谷", "ginza", "銀座", "银座", "roppongi", "六本木", "ueno", "上野", "ikebukuro", "池袋", "akasaka", "赤坂"] },
  { value: "Yokohama", aliases: ["yokohama", "横滨", "横浜"] },
  { value: "Maihama / Disney Area", aliases: ["maihama", "disney", "tokyo disneyland", "tokyo disneysea", "迪士尼", "舞浜", "舞滨", "ディズニー"] },
  { value: "Kawaguchiko / Fuji Area", aliases: ["kawaguchiko", "fuji", "富士", "河口湖"] },
  { value: "Hakone", aliases: ["hakone", "箱根"] },
  { value: "Nikko", aliases: ["nikko", "日光"] },
  { value: "Kamakura", aliases: ["kamakura", "镰仓", "鎌倉"] },
  { value: "Osaka City", aliases: ["osaka city", "osaka", "umeda", "namba", "shinsaibashi", "dotonbori", "大阪", "梅田", "难波", "難波", "心斋桥", "心斎橋", "道顿堀", "道頓堀", "osaka centro"] },
  { value: "Kyoto City", aliases: ["kyoto", "京都", "kioto"] },
  { value: "Nara City", aliases: ["nara", "奈良"] },
  { value: "Kobe City", aliases: ["kobe", "神户", "神戸"] },
  { value: "Wakayama City", aliases: ["wakayama", "和歌山"] },
  { value: "Shirahama", aliases: ["shirahama", "白浜", "白滨"] },
  { value: "USJ", aliases: ["universal studios japan", "universal studios", "usj", "环球影城", "環球影城", "ユニバーサル"] },
  { value: "Niseko", aliases: ["niseko", "二世谷", "二世古"] },
  { value: "Sapporo", aliases: ["sapporo", "札幌"] },
  { value: "Hoshino Resort Tomamu", aliases: ["hoshino", "tomamu", "星野", "トマム"] },
  { value: "Otaru", aliases: ["otaru", "小樽"] },
  { value: "Furano", aliases: ["furano", "富良野"] },
  { value: "Biei", aliases: ["biei", "美瑛"] },
  { value: "Asahikawa", aliases: ["asahikawa", "旭川"] },
  { value: "Lake Toya", aliases: ["lake toya", "toya", "洞爷湖", "洞爺湖"] },
  { value: "Noboribetsu", aliases: ["noboribetsu", "登别", "登別"] },
  { value: "Rusutsu", aliases: ["rusutsu", "留寿都"] },
  { value: "Kiroro", aliases: ["kiroro", "キロロ"] },
  { value: "Hakodate", aliases: ["hakodate", "函馆", "函館"] },
];

const PLACE_ALIASES = [
  ...AIRPORT_ALIASES.map((entry) => ({
    value: entry.code,
    isAirport: true,
    aliases: entry.aliases,
  })),
  ...DESTINATION_ALIASES.map((entry) => ({
    value: entry.value,
    isAirport: false,
    aliases: entry.aliases,
  })),
];

const REGION_ALIASES = [
  { region: "Tokyo", aliases: ["tokyo", "tokio", "东京", "東京", "haneda", "narita", "hnd", "nrt", "羽田", "成田", "shinjuku", "新宿", "shibuya", "ginza", "ueno", "ikebukuro", "roppongi", "yokohama", "hakone", "fuji", "kawaguchiko", "nikko", "kamakura", "disney"] },
  { region: "Osaka", aliases: ["osaka", "大阪", "kansai", "kix", "关西", "関西", "kyoto", "kioto", "京都", "nara", "奈良", "kobe", "神户", "神戸", "wakayama", "和歌山", "usj", "universal studios", "环球影城"] },
  { region: "Hokkaido", aliases: ["hokkaido", "北海道", "new chitose", "nuevo chitose", "cts", "新千歳", "新千岁", "sapporo", "札幌", "niseko", "二世谷", "二世古", "otaru", "小樽", "furano", "富良野", "biei", "美瑛", "asahikawa", "旭川", "lake toya", "洞爷湖", "洞爺湖", "noboribetsu", "登别", "登別", "rusutsu", "留寿都", "tomamu", "hoshino", "星野", "kiroro", "hakodate", "函馆", "函館"] },
];

function includesAny(text, aliases) {
  return aliases.some((alias) => text.includes(alias));
}

function normalizeAirport(message = "") {
  const text = message.toLowerCase();
  const match = AIRPORT_ALIASES.find((entry) => includesAny(text, entry.aliases));
  return match ? match.code : "";
}

function detectRegion(message = "") {
  const text = message.toLowerCase();
  const match = REGION_ALIASES.find((entry) => includesAny(text, entry.aliases));
  return match ? match.region : "";
}

function normalizeDestination(message = "") {
  const text = message.toLowerCase();
  const airport = normalizeAirport(message);
  const candidates = DESTINATION_ALIASES.filter((entry) => includesAny(text, entry.aliases));
  if (airport && candidates.length > 1) {
    const destination = candidates.find((entry) => !entry.aliases.some((alias) => AIRPORT_ALIASES.some((airportEntry) => airportEntry.aliases.includes(alias))));
    if (destination) return destination.value;
  }
  return candidates[0]?.value || "";
}

function normalizePlaceFragment(fragment = "") {
  const text = String(fragment).toLowerCase();
  const matches = [];
  for (const place of PLACE_ALIASES) {
    for (const alias of place.aliases) {
      const index = text.indexOf(alias.toLowerCase());
      if (index >= 0) {
        matches.push({
          value: place.value,
          isAirport: place.isAirport,
          index,
          length: alias.length,
        });
      }
    }
  }
  matches.sort((a, b) => a.index - b.index || b.length - a.length);
  return matches[0] || null;
}

function normalizeLastPlaceFragment(fragment = "") {
  const mentions = findPlaceMentions(fragment);
  return mentions[mentions.length - 1] || null;
}

function findPlaceMentions(message = "") {
  const text = String(message).toLowerCase();
  const mentions = [];
  for (const place of PLACE_ALIASES) {
    for (const alias of place.aliases) {
      const aliasText = alias.toLowerCase();
      let start = 0;
      while (start < text.length) {
        const index = text.indexOf(aliasText, start);
        if (index < 0) break;
        mentions.push({
          value: place.value,
          isAirport: place.isAirport,
          index,
          end: index + aliasText.length,
          length: aliasText.length,
        });
        start = index + aliasText.length;
      }
    }
  }

  mentions.sort((a, b) => a.index - b.index || b.length - a.length);
  const filtered = [];
  for (const mention of mentions) {
    const overlaps = filtered.some((existing) =>
      mention.index < existing.end && existing.index < mention.end
    );
    if (!overlaps) filtered.push(mention);
  }
  return filtered;
}

function normalizeDirectionalText(message = "") {
  return String(message)
    .toLowerCase()
    .replace(/[¿?，。,.]/g, " ")
    .replace(/\bdel\b/g, "de")
    .replace(/\bal\b/g, "a")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRouteByMarkers(message = "") {
  const original = String(message);
  const text = normalizeDirectionalText(original);

  const fromIndex = text.indexOf(" from ");
  const toIndex = text.indexOf(" to ");
  if (fromIndex >= 0 && toIndex > fromIndex) {
    return {
      pickup: normalizePlaceFragment(text.slice(fromIndex + 6, toIndex)),
      dropoff: normalizePlaceFragment(text.slice(toIndex + 4)),
    };
  }
  if (toIndex >= 0 && fromIndex > toIndex) {
    return {
      pickup: normalizePlaceFragment(text.slice(fromIndex + 6)),
      dropoff: normalizePlaceFragment(text.slice(toIndex + 4, fromIndex)),
    };
  }

  const deIndex = text.indexOf(" de ");
  const aIndex = text.indexOf(" a ", Math.max(0, deIndex + 4));
  if (deIndex >= 0 && aIndex > deIndex) {
    return {
      pickup: normalizePlaceFragment(text.slice(deIndex + 4, aIndex)),
      dropoff: normalizePlaceFragment(text.slice(aIndex + 3)),
    };
  }

  const chineseFromIndex = original.indexOf("从");
  const chineseToIndex = ["到", "去"].map((token) => original.indexOf(token, Math.max(0, chineseFromIndex + 1))).filter((index) => index >= 0)[0];
  if (chineseFromIndex >= 0 && chineseToIndex > chineseFromIndex) {
    return {
      pickup: normalizePlaceFragment(original.slice(chineseFromIndex + 1, chineseToIndex)),
      dropoff: normalizePlaceFragment(original.slice(chineseToIndex + 1)),
    };
  }

  const directCandidates = [];
  for (const token of ["到", "去"]) {
    let start = 0;
    while (start < original.length) {
      const index = original.indexOf(token, start);
      if (index < 0) break;
      const pickup = normalizeLastPlaceFragment(original.slice(0, index));
      const dropoff = normalizePlaceFragment(original.slice(index + 1));
      if (pickup && dropoff) {
        directCandidates.push({ pickup, dropoff });
      }
      start = index + 1;
    }
  }
  if (directCandidates.length) {
    return directCandidates.find((candidate) => candidate.pickup.isAirport || candidate.dropoff.isAirport)
      || directCandidates[directCandidates.length - 1];
  }

  return null;
}

function parseRoute(message = "") {
  const markerRoute = parseRouteByMarkers(message);
  if (markerRoute?.pickup && markerRoute?.dropoff) return markerRoute;

  const mentions = findPlaceMentions(message);
  if (mentions.length >= 2) {
    const airportMention = mentions.find((mention) => mention.isAirport);
    if (airportMention) {
      const destinationAfterAirport = mentions.find((mention) => mention.index > airportMention.index && !mention.isAirport);
      const originBeforeAirport = [...mentions].reverse().find((mention) => mention.index < airportMention.index && !mention.isAirport);
      if (destinationAfterAirport) {
        return { pickup: airportMention, dropoff: destinationAfterAirport };
      }
      if (originBeforeAirport) {
        return { pickup: originBeforeAirport, dropoff: airportMention };
      }
    }
    return {
      pickup: mentions[0],
      dropoff: mentions.find((mention, index) => index > 0 && mention.value !== mentions[0].value) || mentions[1],
    };
  }
  if (mentions.length === 1) {
    return { pickup: null, dropoff: mentions[0] };
  }
  return { pickup: null, dropoff: null };
}

function detectServiceType(message = "", route = {}) {
  const text = String(message).toLowerCase();
  if (
    /(?:\b\d+\s*-\s*day\b|\b\d+\s*days\b|\b\d+\s*días\b|\b\d+\s*dias\b|[二两兩三四五六七八九十\d]+\s*天|多日|连续包车|連續包車|連日|複数日)/i.test(message)
    && /(charter|tour|包车|貸切|private|privado|私家)/i.test(message)
  ) {
    return "multi_day_charter";
  }
  if (
    text.includes("one day charter")
    || text.includes("car charter")
    || text.includes("private car")
    || text.includes("por un día")
    || text.includes("por un dia")
    || text.includes("coche privado")
    || text.includes("tour privado")
    || text.includes("一天包车")
    || text.includes("一日包车")
    || text.includes("包车一天")
    || text.includes("一日游")
  ) {
    return "charter";
  }
  if (route.pickup?.isAirport && route.dropoff && !route.dropoff.isAirport) return "airport_pickup";
  if (route.dropoff?.isAirport && route.pickup && !route.pickup.isAirport) return "airport_dropoff";
  if (route.pickup && route.dropoff && !route.pickup.isAirport && !route.dropoff.isAirport) return "point_to_point";
  if (text.includes("接送机")) return "airport_pickup";
  if (text.includes("送机") || text.includes("airport drop") || text.includes("to airport") || text.includes("al aeropuerto")) return "airport_dropoff";
  if (text.includes("接机") || text.includes("airport pickup") || text.includes("arriving") || text.includes("llegamos")) return "airport_pickup";
  return "airport_pickup";
}

function parseSimpleNumber(value) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const numerals = {
    一: 1,
    二: 2,
    两: 2,
    兩: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  if (value === "十") return 10;
  if (value.startsWith("十")) return 10 + (numerals[value[1]] || 0);
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (numerals[tens] || 1) * 10 + (numerals[ones] || 0);
  }
  return numerals[value] || 0;
}

function extractCount(message, patterns) {
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return parseSimpleNumber(match[1]);
  }
  return 0;
}

function extractPassengerCount(message = "") {
  const adultCount = extractCount(message, [
    /([一二两兩三四五六七八九十\d]+)\s*(?:个|位|名)?(?:大人|成人)/,
    /\b(\d+)\s*(?:adults|adultos|adultas)\b/i,
  ]);
  const childCount = extractCount(message, [
    /([一二两兩三四五六七八九十\d]+)\s*(?:个|位|名)?(?:孩子|小孩|儿童|小朋友)/,
    /\b(\d+)\s*(?:children|kids|child|niños|ninos|niñas|ninas)\b/i,
  ]);
  if (adultCount || childCount) return adultCount + childCount;

  return extractCount(message, [
    /\b(\d+)\s*(?:people|passengers|pax)\b/i,
    /\bfor\s+(\d+)\s+people\b/i,
    /\b(\d+)\s*(?:personas|pasajeros|viajeros)\b/i,
    /([一二两兩三四五六七八九十\d]+)\s*(?:个人|人|位|名)/,
  ]);
}

function extractDate(message = "") {
  const monthNames = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    setiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };
  const text = message.toLowerCase();
  const monthKeys = Object.keys(monthNames).join("|");
  const match = text.match(new RegExp(`\\b(${monthKeys})\\s+(\\d{1,2})\\b`));
  if (match) return `2026-${monthNames[match[1]]}-${String(Number(match[2])).padStart(2, "0")}`;
  const spanishMatch = text.match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${monthKeys})\\b`));
  if (spanishMatch) return `2026-${monthNames[spanishMatch[2]]}-${String(Number(spanishMatch[1])).padStart(2, "0")}`;
  const numericMatch = message.match(/(?:2026年)?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*(?:日|号)?/);
  if (numericMatch) {
    return `2026-${String(Number(numericMatch[1])).padStart(2, "0")}-${String(Number(numericMatch[2])).padStart(2, "0")}`;
  }
  return "";
}

function extractTime(message = "") {
  const match = message.match(/\b(\d{1,2}:\d{2})\b/);
  if (match) return match[1];
  const halfMatch = message.match(/(?:上午|早上|下午|晚上)?\s*(\d{1,2})\s*点\s*半/);
  if (halfMatch) {
    let hour = Number(halfMatch[1]);
    if (/下午|晚上/.test(halfMatch[0]) && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:30`;
  }
  const hourMatch = message.match(/(?:上午|早上|下午|晚上)?\s*(\d{1,2})\s*点/);
  if (hourMatch) {
    let hour = Number(hourMatch[1]);
    if (/下午|晚上/.test(hourMatch[0]) && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:00`;
  }
  return "";
}

function extractFlightNumber(message = "") {
  const match = message.match(/\b([A-Z]{2}\d{3,4})\b/i);
  return match ? match[1].toUpperCase() : "";
}

function detectPreferredLanguage(message = "") {
  const text = message.toLowerCase();
  if (text.includes("chinese")) return "Chinese";
  if (text.includes("english")) return "English";
  if (text.includes("japanese")) return "Japanese";
  if (text.includes("spanish") || text.includes("español") || text.includes("espanol")) return "Spanish";
  return "Chinese";
}

function hasSkiEquipment(message = "") {
  const text = message.toLowerCase();
  return text.includes("ski")
    || text.includes("snowboard")
    || text.includes("esquí")
    || text.includes("esqui")
    || text.includes("tabla de nieve")
    || text.includes("雪板")
    || text.includes("滑雪");
}

function hasShoppingStop(message = "") {
  const text = message.toLowerCase();
  return text.includes("shopping stop") || text.includes("photo stop") || text.includes("restaurant stop") || text.includes("eat on the way");
}

function hasChildSeatRequest(message = "") {
  const text = String(message).toLowerCase();
  return text.includes("child seat")
    || text.includes("baby seat")
    || text.includes("asiento para niño")
    || text.includes("silla para bebé")
    || text.includes("silla para bebe")
    || text.includes("儿童座椅")
    || text.includes("宝宝椅")
    || text.includes("安全座椅");
}

function hasChildMention(message = "") {
  const text = String(message).toLowerCase();
  return hasChildSeatRequest(message)
    || text.includes("child")
    || text.includes("kid")
    || text.includes("baby")
    || text.includes("niño")
    || text.includes("nino")
    || text.includes("bebé")
    || text.includes("bebe")
    || text.includes("小孩")
    || text.includes("孩子")
    || text.includes("儿童")
    || text.includes("小朋友");
}

function hasStroller(message = "") {
  const text = String(message).toLowerCase();
  return text.includes("stroller")
    || text.includes("baby stroller")
    || text.includes("cochecito")
    || text.includes("婴儿车")
    || text.includes("嬰兒車")
    || text.includes("推车")
    || text.includes("推車");
}

function hasSignageRequest(message = "") {
  const text = String(message).toLowerCase();
  return text.includes("placard")
    || text.includes("name sign")
    || text.includes("meet and greet")
    || text.includes("hold a sign")
    || text.includes("cartel con nombre")
    || text.includes("con un cartel")
    || text.includes("举牌")
    || text.includes("舉牌")
    || text.includes("拿牌子")
    || text.includes("牌子等");
}

function recommendVehicle({ passenger_count, luggage_count, ski_equipment_count }) {
  if (ski_equipment_count > 0 && passenger_count >= 4 && luggage_count >= 4) return "HiAce";
  if (passenger_count >= 5 || luggage_count >= 5) return "HiAce";
  return "Alphard/Vellfire";
}

function extractOrder(customerMessage) {
  const passengerCount = extractPassengerCount(customerMessage);
  const luggageCount = extractCount(customerMessage, [
    /\b(\d+)\s*(?:suitcases|luggage|bags)\b/i,
    /\bwith\s+(\d+)\s+suitcases\b/i,
    /\b(\d+)\s*(?:maletas|equipajes|bolsas)\b/i,
    /([一二两兩三四五六七八九十\d]+)\s*(?:个|件)?(?:箱子|行李|大箱|大件行李)/,
  ]);
  const strollerDetected = hasStroller(customerMessage);
  const strollerCount = strollerDetected
    ? extractCount(customerMessage, [
      /\b(\d+)\s*(?:baby strollers|strollers|cochecitos)/i,
      /([一二两兩三四五六七八九十\d]+)\s*(?:个|台)?(?:婴儿车|嬰兒車|推车|推車)/,
    ]) || 1
    : 0;
  const adjustedLuggageCount = luggageCount + strollerCount;
  const skiEquipmentCount = hasSkiEquipment(customerMessage)
    ? extractCount(customerMessage, [
      /\b(\d+)\s*(?:ski bags|skis|snowboard bags)\b/i,
      /\b(\d+)\s*(?:bolsas de esquí|bolsas de esqui|esquís|esquis|snowboards|tablas de nieve)/i,
      /([一二两兩三四五六七八九十\d]+)\s*(?:个|件)?(?:雪板|滑雪板|滑雪包|雪具)/,
    ]) || 1
    : 0;
  const route = parseRoute(customerMessage);
  const serviceType = detectServiceType(customerMessage, route);
  const airport = normalizeAirport(customerMessage);
  const region = detectRegion(customerMessage);
  const pickupDate = extractDate(customerMessage);
  const pickupTime = extractTime(customerMessage);
  const flightNumber = extractFlightNumber(customerMessage);
  const pickupLocation = route.pickup?.value || (serviceType === "airport_pickup" ? airport : "");
  const dropoffLocation = route.dropoff?.value || normalizeDestination(customerMessage);
  const arrivalAirport = serviceType === "airport_pickup"
    ? (route.pickup?.isAirport ? route.pickup.value : airport)
    : "";
  const departureAirport = serviceType === "airport_dropoff"
    ? (route.dropoff?.isAirport ? route.dropoff.value : airport)
    : "";
  const vehicleType = recommendVehicle({
    passenger_count: passengerCount,
    luggage_count: adjustedLuggageCount,
    ski_equipment_count: skiEquipmentCount,
  });
  const shoppingStop = hasShoppingStop(customerMessage);
  const finalServiceType = shoppingStop ? "charter" : serviceType;
  const childSeatRequired = hasChildSeatRequest(customerMessage);
  const childSeatCount = childSeatRequired
    ? extractCount(customerMessage, [
      /\b(\d+)\s*(?:child seats|baby seats|asientos|sillas)/i,
      /([一二两兩三四五六七八九十\d]+)\s*(?:个|张)?(?:儿童座椅|宝宝椅|安全座椅)/,
    ]) || 1
    : 0;
  const childMentioned = hasChildMention(customerMessage);
  const signageRequired = hasSignageRequest(customerMessage);

  const draft = {
    source: "ai_agent",
    service_type: finalServiceType,
    region,
    arrival_airport: arrivalAirport,
    departure_airport: departureAirport,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    pickup_date: pickupDate,
    pickup_time: pickupTime,
    flight_number: flightNumber,
    passenger_count: passengerCount,
    luggage_count: adjustedLuggageCount,
    base_luggage_count: luggageCount,
    stroller_count: strollerCount,
    stroller_detected: strollerDetected,
    special_luggage: strollerDetected ? ["baby_stroller"] : [],
    ski_equipment_count: skiEquipmentCount,
    child_seat_required: childSeatRequired,
    child_seat_count: childSeatCount,
    child_mentioned: childMentioned,
    child_seat_details_required: childMentioned && !childSeatRequired,
    signage_required: signageRequired,
    preferred_language: detectPreferredLanguage(customerMessage),
    vehicle_type: vehicleType,
    recommended_vehicle: vehicleType,
    missing_fields: [],
    operator_review_required: false,
    reason: "",
  };

  if (!draft.region) draft.missing_fields.push("region");
  if (draft.service_type === "airport_pickup" && !draft.arrival_airport) draft.missing_fields.push("arrival_airport");
  if (draft.service_type === "airport_dropoff" && !draft.departure_airport) draft.missing_fields.push("departure_airport");
  if (draft.service_type !== "airport_pickup" && !draft.pickup_location) draft.missing_fields.push("pickup_location");
  if (!draft.dropoff_location) draft.missing_fields.push("dropoff_location");
  if (!draft.passenger_count) draft.missing_fields.push("passenger_count");
  if (!draft.luggage_count) draft.missing_fields.push("luggage_count");
  if (draft.child_seat_details_required) draft.missing_fields.push("child_seat_details");
  for (const field of ["pickup_date", "pickup_time"]) {
    if (!draft[field]) draft.missing_fields.push(field);
  }
  if (draft.service_type === "airport_pickup" && !draft.flight_number) {
    draft.missing_fields.push("flight_number");
  }

  if (skiEquipmentCount > 0) {
    draft.operator_review_required = true;
    draft.reason = "Ski equipment / large luggage requires vehicle and luggage confirmation.";
  }

  if (shoppingStop) {
    draft.recommend_service_type = "charter";
    draft.message = "This would be considered a charter service rather than a point-to-point transfer.";
  }

  return draft;
}

module.exports = {
  extractOrder,
  normalizeAirport,
  normalizeDestination,
  parseRoute,
  detectServiceType,
};
