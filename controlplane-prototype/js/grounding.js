// ControlPlane.ai — Grounding Engine (Phase 1.1)
// Dependency-free TF-IDF retrieval with claim extraction, numeric conflict
// detection, and per-claim verdicts. Works fully offline.

const GroundingEngine = {

    _stopwords: new Set([
        'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could',
        'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'up', 'about', 'into', 'through',
        'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
        'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
        'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
        'same', 'so', 'than', 'too', 'very', 'and', 'but', 'or', 'if', 'because', 'as', 'until',
        'while', 'that', 'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our',
        'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'which', 'what',
        'who', 'whom', 'whose'
    ]),

    _index: null,     // TF-IDF index built at load
    _docs: null,      // Processed docs
    _idf: null,       // IDF values

    // ====================================================================
    //  TOKENIZATION & TEXT PROCESSING
    // ====================================================================
    _tokenize: (text) => {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !GroundingEngine._stopwords.has(w));
    },

    // ====================================================================
    //  BUILD TF-IDF INDEX AT LOAD TIME
    // ====================================================================
    buildIndex: async () => {
        if (typeof GROUNDING_CORPUS === 'undefined' || GROUNDING_CORPUS.length === 0) return;

        const docs = GROUNDING_CORPUS.map(doc => {
            const tokens = GroundingEngine._tokenize(doc.title + ' ' + doc.text);
            const tf = {};
            tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
            const maxTf = Math.max(...Object.values(tf), 1);
            Object.keys(tf).forEach(t => { tf[t] /= maxTf; });
            return { ...doc, tokens, tf, tokenCount: tokens.length };
        });

        const N = docs.length;
        const docFreq = {};
        docs.forEach(doc => {
            const unique = new Set(doc.tokens);
            unique.forEach(t => { docFreq[t] = (docFreq[t] || 0) + 1; });
        });
        const idf = {};
        Object.keys(docFreq).forEach(t => {
            idf[t] = Math.log(N / docFreq[t]) + 1;
        });

        GroundingEngine._docs = docs;
        GroundingEngine._idf = idf;
        GroundingEngine._index = true;
    },

    // ====================================================================
    //  COSINE SIMILARITY
    // ====================================================================
    _cosineSimilarity: (queryTf, docTf, idf) => {
        let dotProduct = 0, queryNorm = 0, docNorm = 0;
        const allTerms = new Set([...Object.keys(queryTf), ...Object.keys(docTf)]);
        allTerms.forEach(term => {
            const qi = (queryTf[term] || 0) * (idf[term] || 1);
            const di = (docTf[term] || 0) * (idf[term] || 1);
            dotProduct += qi * di;
            queryNorm += qi * qi;
            docNorm += di * di;
        });
        if (queryNorm === 0 || docNorm === 0) return 0;
        return dotProduct / (Math.sqrt(queryNorm) * Math.sqrt(docNorm));
    },

    // ====================================================================
    //  RETRIEVE TOP-K DOCS FOR A QUERY
    // ====================================================================
    retrieve: async (queryText, useCaseId, topK = 3) => {
        if (!GroundingEngine._index) return [];

        const queryTokens = GroundingEngine._tokenize(queryText);
        const queryTf = {};
        queryTokens.forEach(t => { queryTf[t] = (queryTf[t] || 0) + 1; });
        const maxQ = Math.max(...Object.values(queryTf), 1);
        Object.keys(queryTf).forEach(t => { queryTf[t] /= maxQ; });

        const candidates = GroundingEngine._docs.filter(d =>
            !useCaseId || d.useCaseIds.includes(useCaseId)
        );

        const scored = candidates.map(doc => ({
            doc,
            score: GroundingEngine._cosineSimilarity(queryTf, doc.tf, GroundingEngine._idf)
        })).sort((a, b) => b.score - a.score);

        return scored.slice(0, topK);
    },

    // ====================================================================
    //  CLAIM EXTRACTION — split response into atomic claims
    // ====================================================================
    extractClaims: (responseText) => {
        // Split on sentence boundaries, then on semicolons and conjunctions
        const rawSentences = responseText
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 15);

        const claims = [];
        rawSentences.forEach(sentence => {
            // Split on semicolons and significant conjunctions
            const parts = sentence.split(/\s*[;]\s*|\s+(?:but|however|although|whereas)\s+/i);
            parts.forEach(part => {
                const trimmed = part.trim();
                if (trimmed.length > 15) {
                    claims.push(trimmed);
                }
            });
        });

        return claims;
    },

    // ====================================================================
    //  EXTRACT NUMBERS WITH CONTEXT
    // ====================================================================
    _extractNumbers: (text) => {
        const results = [];
        // Match numbers with optional units/context
        const regex = /(\$?\d+(?:[,.\s]\d+)*(?:\.\d+)?)\s*(%|days?|weeks?|months?|years?|hours?|minutes?|dollars?|USD|EUR|employees?|people|items?|units?|M|K|B)?/gi;
        let m;
        while ((m = regex.exec(text)) !== null) {
            const numStr = m[1].replace(/[,\s]/g, '');
            const num = parseFloat(numStr);
            if (!isNaN(num)) {
                const context = text.substring(Math.max(0, m.index - 30), Math.min(text.length, m.index + m[0].length + 30));
                results.push({ value: num, unit: (m[2] || '').toLowerCase(), raw: m[0], context });
            }
        }
        return results;
    },

    // ====================================================================
    //  DETECT NUMERIC CONFLICTS
    // ====================================================================
    _detectNumericConflict: (claimNumbers, sourceNumbers) => {
        const conflicts = [];
        claimNumbers.forEach(cn => {
            // First, see if there is an exact match for this claim number and unit in the source
            const exactMatch = sourceNumbers.some(sn => sn.value === cn.value && sn.unit === cn.unit);
            if (exactMatch) return; // Verified, no conflict

            sourceNumbers.forEach(sn => {
                // Match on similar context (unit match or nearby keywords match)
                if (cn.unit && sn.unit && cn.unit === sn.unit && cn.value !== sn.value) {
                    conflicts.push({
                        claimValue: cn.raw,
                        sourceValue: sn.raw,
                        detail: `Claim says "${cn.raw}" but source says "${sn.raw}"`
                    });
                }
                // Match on similar context keywords even without unit
                if (!cn.unit && !sn.unit) {
                    const claimContext = cn.context.toLowerCase();
                    const srcContext = sn.context.toLowerCase();
                    const sharedKeywords = GroundingEngine._tokenize(claimContext)
                        .filter(w => srcContext.includes(w) && w.length > 3);
                    if (sharedKeywords.length >= 2 && cn.value !== sn.value) {
                        conflicts.push({
                            claimValue: cn.raw,
                            sourceValue: sn.raw,
                            detail: `Potential numeric mismatch: claim "${cn.raw}" vs source "${sn.raw}" (shared context: ${sharedKeywords.slice(0, 3).join(', ')})`
                        });
                    }
                }
            });
        });
        return conflicts;
    },

    // ====================================================================
    //  POLARITY CONFLICT DETECTION
    // ====================================================================
    _detectPolarityConflict: (claimText, sourceText) => {
        const polarityPairs = [
            ['lifetime guarantee', '30-day'], ['lifetime guarantee', '30 days'], 
            ['unlimited', 'limited'], ['always', 'never'],
            ['no questions asked', 'provided'], ['100%', 'partial'],
            ['full refund', 'store credit'], ['anytime', 'within'],
            ['guaranteed', 'may'], ['unconditional', 'conditional'],
            ['no restrictions', 'restrictions'], ['free', 'fee'],
            ['private jet', 'standard shipping']
        ];
        
        const claimLower = claimText.toLowerCase();
        const sourceLower = sourceText.toLowerCase();

        const isFuzzyMatch = (phrase, text) => {
            const words = phrase.split(' ');
            if (words.length === 1) return text.includes(phrase);
            const regex = new RegExp(words.join('\\s+(?:\\w+\\s+){0,3}'), 'i');
            return regex.test(text);
        };

        const isNegated = (phrase, text) => {
            const words = phrase.split(' ');
            const joined = words.join('\\s+(?:\\w+\\s+){0,3}');
            const regex = new RegExp(`(?:not a|isn't|is not|no longer|without|never|do not|does not|not)\\s+(?:\\w+\\s+){0,3}(${joined})`, 'i');
            return regex.test(text);
        };

        for (const [a, b] of polarityPairs) {
            const claimHasA = isFuzzyMatch(a, claimLower);
            const claimHasB = isFuzzyMatch(b, claimLower);
            
            if (claimHasA) {
                if (isNegated(a, sourceLower)) {
                    return { claimTerm: a, sourceTerm: `negated ${a}`, detail: `Claim uses "${a}" but source explicitly negates it.` };
                }
                const sourceHasB = isFuzzyMatch(b, sourceLower);
                if (sourceHasB) {
                    const sourceHasA = isFuzzyMatch(a, sourceLower);
                    if (!sourceHasA || b.includes(a)) {
                        return { claimTerm: a, sourceTerm: b, detail: `Claim uses "${a}" but source says "${b}"` };
                    }
                }
            }
            if (claimHasB) {
                if (isNegated(b, sourceLower)) {
                    return { claimTerm: b, sourceTerm: `negated ${b}`, detail: `Claim uses "${b}" but source explicitly negates it.` };
                }
                const sourceHasA = isFuzzyMatch(a, sourceLower);
                if (sourceHasA) {
                    const sourceHasB = isFuzzyMatch(b, sourceLower);
                    if (!sourceHasB || a.includes(b)) {
                        return { claimTerm: b, sourceTerm: a, detail: `Claim uses "${b}" but source says "${a}"` };
                    }
                }
            }
        }
        return null;
    },

    // ====================================================================
    //  VERIFY A SINGLE CLAIM AGAINST THE CORPUS
    // ====================================================================
    verifyClaim: async (claimText, useCaseId) => {
        const topDocs = await GroundingEngine.retrieve(claimText, useCaseId, 3);
        if (topDocs.length === 0 || topDocs[0].score < 0.05) {
            return { verdict: 'UNSUPPORTED', score: 0, topDocs: [], detail: 'No relevant source documents found' };
        }

        // Task 4: Mixed Data Source Quality (Corpus Ambiguity)
        if (topDocs.length >= 2 && topDocs[0].score > 0.1 && (topDocs[0].score - topDocs[1].score) < 0.1) {
            const doc0Nums = GroundingEngine._extractNumbers(topDocs[0].doc.text);
            const doc1Nums = GroundingEngine._extractNumbers(topDocs[1].doc.text);
            const interDocConflict = GroundingEngine._detectNumericConflict(doc0Nums, doc1Nums);
            if (interDocConflict.length > 0) {
                return {
                    verdict: 'AMBIGUOUS',
                    score: topDocs[0].score,
                    topDocs: topDocs.map(d => ({ title: d.doc.title, score: d.score, sourceRef: d.doc.sourceRef })),
                    detail: `Corpus ambiguity detected: top sources contradict each other (Doc 1 vs Doc 2: ${interDocConflict[0].detail})`,
                    conflictType: 'corpus_contradiction',
                    sourceDoc: 'Multiple Conflicting Sources',
                    sourceRef: 'Multiple'
                };
            }
        }

        const bestDoc = topDocs[0];
        const claimNumbers = GroundingEngine._extractNumbers(claimText);
        const sourceNumbers = GroundingEngine._extractNumbers(bestDoc.doc.text);

        // Check for numeric conflicts
        const numericConflicts = GroundingEngine._detectNumericConflict(claimNumbers, sourceNumbers);

        // Check for polarity conflicts
        const polarityConflict = GroundingEngine._detectPolarityConflict(claimText, bestDoc.doc.text);

        // Check if a cited reference matches a corpus source
        const citationRefs = claimText.match(/Article\s+\d+(?:\(\d+\))?(?:\([a-z]\))?/gi) || [];
        let citationVerified = false;
        if (citationRefs.length > 0) {
            citationVerified = citationRefs.some(ref =>
                bestDoc.doc.text.toLowerCase().includes(ref.toLowerCase()) ||
                bestDoc.doc.sourceRef.toLowerCase().includes(ref.toLowerCase())
            );
        }

        // Determine verdict
        if (numericConflicts.length > 0 || polarityConflict) {
            const conflictDetail = numericConflicts.length > 0
                ? numericConflicts[0].detail
                : polarityConflict.detail;
            return {
                verdict: 'CONTRADICTED',
                score: bestDoc.score,
                topDocs: topDocs.map(d => ({ title: d.doc.title, score: d.score, sourceRef: d.doc.sourceRef })),
                detail: conflictDetail,
                conflictType: numericConflicts.length > 0 ? 'numeric' : 'polarity',
                sourceDoc: bestDoc.doc.title,
                sourceRef: bestDoc.doc.sourceRef,
                citationVerified
            };
        }

        if (bestDoc.score > 0.25) {
            // Check for key entity overlap
            const claimTokens = new Set(GroundingEngine._tokenize(claimText));
            const sourceTokens = new Set(GroundingEngine._tokenize(bestDoc.doc.text));
            const overlap = [...claimTokens].filter(t => sourceTokens.has(t));

            if (overlap.length >= 3 || citationVerified) {
                return {
                    verdict: 'SUPPORTED',
                    score: bestDoc.score,
                    topDocs: topDocs.map(d => ({ title: d.doc.title, score: d.score, sourceRef: d.doc.sourceRef })),
                    detail: `Supported by "${bestDoc.doc.title}" (${overlap.length} key term overlap)`,
                    sourceDoc: bestDoc.doc.title,
                    sourceRef: bestDoc.doc.sourceRef,
                    citationVerified
                };
            }
        }

        return {
            verdict: 'UNSUPPORTED',
            score: bestDoc.score,
            topDocs: topDocs.map(d => ({ title: d.doc.title, score: d.score, sourceRef: d.doc.sourceRef })),
            detail: `Insufficient evidence to verify (best match: "${bestDoc.doc.title}" at ${(bestDoc.score * 100).toFixed(0)}%)`,
            sourceDoc: bestDoc.doc.title,
            citationVerified
        };
    },

    // ====================================================================
    //  FULL GROUNDING ANALYSIS — verify all claims in a response
    // ====================================================================
    analyzeGrounding: async (prompt, response, useCaseId) => {
        if (!GroundingEngine._index) {
            await GroundingEngine.buildIndex();
        }

        const claims = GroundingEngine.extractClaims(response);
        const claimResults = await Promise.all(claims.map(async claim => ({
            claim,
            ...(await GroundingEngine.verifyClaim(claim, useCaseId))
        })));

        const supported = claimResults.filter(c => c.verdict === 'SUPPORTED').length;
        const contradicted = claimResults.filter(c => c.verdict === 'CONTRADICTED').length;
        const unsupported = claimResults.filter(c => c.verdict === 'UNSUPPORTED').length;
        const total = claimResults.length || 1;

        const unsupportedRatio = (unsupported + contradicted) / total;
        const contradictedCount = contradicted;

        // Combined grounding score: higher = more risk
        const groundingRisk = Math.min(1.0,
            (unsupportedRatio * 0.6) + (contradictedCount * 0.3) + (unsupported > 0 && total > 1 ? 0.1 : 0)
        );

        // Check for verified citations that should reduce risk
        const verifiedCitations = claimResults.filter(c => c.citationVerified).length;

        return {
            groundingRisk,
            unsupportedRatio,
            contradictedCount,
            supportedCount: supported,
            unsupportedCount: unsupported,
            totalClaims: claims.length,
            verifiedCitations,
            claimResults,
            summary: contradicted > 0
                ? `${contradicted} claim(s) contradicted by trusted sources`
                : unsupported > total * 0.5
                    ? `${unsupported} of ${total} claims could not be verified`
                    : verifiedCitations > 0
                        ? `${supported} claims supported, ${verifiedCitations} citation(s) verified`
                        : `${supported} of ${total} claims verified against corpus`
        };
    }
};

// Build the index when the script loads
if (typeof GROUNDING_CORPUS !== 'undefined') {
    GroundingEngine.initPromise = GroundingEngine.buildIndex();
}
