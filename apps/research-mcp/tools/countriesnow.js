import { z } from "zod";
import { fetchJson } from "../fetch.js";

const CAPITAL_URL = "https://countriesnow.space/api/v0.1/countries/capital";

function clean(value) {
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
}

export const countryCapitalTools = [
    [
        "country_capital",
        "Look up a country's capital city by name or ISO code (for example 'France', 'JP' or 'JPN') using the CountriesNow public API. Returns the country name, capital, ISO2 and ISO3 codes. The data is name and capital only — no population, area or other country facts. The endpoint answers the whole 250-country list in one fetch, so the tool matches client-side; a few territories have no capital, returned as null.",
        {
            country: z.string().trim().min(1).max(100),
        },
        async ({ country }) => {
            const query = String(country ?? "").trim();
            if (query === "") throw new Error("country must not be blank.");
            const data = await fetchJson(CAPITAL_URL);
            if (!Array.isArray(data?.data))
                throw new Error("Invalid CountriesNow response");
            const wanted = query.toLowerCase();
            const match =
                data.data.find(
                    (entry) => clean(entry.name)?.toLowerCase() === wanted,
                ) ??
                data.data.find(
                    (entry) => clean(entry.iso2)?.toLowerCase() === wanted,
                ) ??
                data.data.find(
                    (entry) => clean(entry.iso3)?.toLowerCase() === wanted,
                );
            if (!match) throw new Error(`No country found for "${query}".`);
            return {
                country: clean(match.name),
                capital: clean(match.capital),
                iso2: clean(match.iso2),
                iso3: clean(match.iso3),
            };
        },
    ],
];
