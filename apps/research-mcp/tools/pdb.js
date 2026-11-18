import { z } from "zod";
import { fetchJson } from "../fetch.js";

const API_ROOT = "https://data.rcsb.org/rest/v1/core/entry";

function datePart(iso) {
    return typeof iso === "string" ? iso.slice(0, 10) : null;
}

function citationSummary(citation) {
    if (!citation) return null;
    const pages =
        citation.page_first && citation.page_last
            ? `${citation.page_first}-${citation.page_last}`
            : (citation.page_first ?? null);
    return {
        title: citation.title ?? null,
        journal:
            citation.rcsb_journal_abbrev ?? citation.journal_abbrev ?? null,
        volume: citation.journal_volume ?? null,
        pages,
        year: citation.year ?? null,
        doi: citation.pdbx_database_id_DOI ?? null,
        pubmed: citation.pdbx_database_id_PubMed ?? null,
        authors: citation.rcsb_authors ?? [],
    };
}

export const pdbTools = [
    [
        "pdb_entry",
        "Look up one experimental protein structure in the Protein Data Bank (RCSB PDB): title, experimental method, resolution, deposition and release dates, and the primary citation. Give a 4-character PDB id such as 4HHB. This is experimental structure data; for predicted structures see alphafold_prediction.",
        {
            id: z
                .string()
                .min(4)
                .max(4)
                .describe("4-character PDB entry id, for example 4HHB."),
        },
        async ({ id }) => {
            const entryId = id.trim().toUpperCase();
            if (!/^[A-Z0-9]{4}$/.test(entryId))
                throw new Error(
                    "PDB id must be exactly 4 letters or digits, for example 4HHB.",
                );
            let data;
            try {
                data = await fetchJson(`${API_ROOT}/${entryId}`);
            } catch (error) {
                if (/HTTP 404/.test(error.message))
                    throw new Error(`No PDB entry found for ${entryId}.`);
                throw error;
            }
            const info = data.rcsb_entry_info ?? {};
            const accession = data.rcsb_accession_info ?? {};
            return {
                id: data.rcsb_id ?? entryId,
                title: data.struct?.title ?? null,
                experimental_method:
                    info.experimental_method ?? data.exptl?.[0]?.method ?? null,
                resolution_angstrom:
                    info.resolution_combined?.[0] ??
                    info.diffrn_resolution_high?.value ??
                    null,
                deposit_date: datePart(accession.deposit_date),
                release_date: datePart(accession.initial_release_date),
                citation: citationSummary(data.rcsb_primary_citation),
            };
        },
    ],
];
