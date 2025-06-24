// A simplified fuzzy logic engine inspired by skfuzzy, implemented in TypeScript.

type FuzzySet = {
    low: (x: number) => number;
    medium: (x: number) => number;
    high: (x: number) => number;
}

const trimf = (points: [number, number, number]) => (x: number): number => {
    const [a, b, c] = points;
    if (x < a || x > c || b < a || c < b) return 0;
    const val = Math.min((x - a) / (b - a), (c - x) / (c - b));
    return Math.max(0, val);
};

// Define Antecedents (Inputs)
export const temp: FuzzySet = {
    low: trimf([0, 10, 20]),
    medium: trimf([15, 27.5, 40]),
    high: trimf([30, 45, 50]),
};

export const humidity: FuzzySet = {
    low: trimf([0, 25, 50]),
    medium: trimf([40, 65, 90]),
    high: trimf([75, 100, 100]),
};

export const wind: FuzzySet = {
    low: trimf([0, 20, 40]),
    medium: trimf([30, 65, 100]),
    high: trimf([80, 120, 150]),
};

// Define Consequent (Output)
export const risk: FuzzySet = {
    low: trimf([0, 20, 40]),
    medium: trimf([30, 50, 70]),
    high: trimf([60, 80, 100]),
};

// Define the rules for cyclone risk
const rules: {antecedents: Partial<{[key in 'temp' | 'humidity' | 'wind']: keyof FuzzySet}>, consequent: keyof FuzzySet}[] = [
    { antecedents: { temp: 'high', humidity: 'high', wind: 'high' }, consequent: 'high' },
    { antecedents: { temp: 'high', humidity: 'high', wind: 'medium' }, consequent: 'high' },
    { antecedents: { temp: 'medium', humidity: 'high', wind: 'high' }, consequent: 'medium' },
    { antecedents: { temp: 'high', humidity: 'medium', wind: 'high' }, consequent: 'medium' },
    { antecedents: { temp: 'high', humidity: 'high', wind: 'low' }, consequent: 'medium' },
    { antecedents: { temp: 'low' }, consequent: 'low' },
    { antecedents: { humidity: 'low' }, consequent: 'low' },
    { antecedents: { wind: 'low' }, consequent: 'low' },
];

/**
 * Calculates cyclone risk using a simplified fuzzy logic system.
 */
export function calculateCycloneRisk(inputs: { temp: number; humidity: number; wind: number }): number {
    // 1. Fuzzification
    const tempMembership = { low: temp.low(inputs.temp), medium: temp.medium(inputs.temp), high: temp.high(inputs.temp) };
    const humidityMembership = { low: humidity.low(inputs.humidity), medium: humidity.medium(inputs.humidity), high: humidity.high(inputs.humidity) };
    const windMembership = { low: wind.low(inputs.wind), medium: wind.medium(inputs.wind), high: wind.high(inputs.wind) };

    const riskActivations = { low: 0, medium: 0, high: 0 };

    // 2. Rule Evaluation
    rules.forEach(rule => {
        const conditions = rule.antecedents;
        const tempCondition = conditions.temp ? tempMembership[conditions.temp] : 1;
        const humidityCondition = conditions.humidity ? humidityMembership[conditions.humidity] : 1;
        const windCondition = conditions.wind ? windMembership[conditions.wind] : 1;
        
        const strength = Math.min(tempCondition, humidityCondition, windCondition);
        
        riskActivations[rule.consequent] = Math.max(riskActivations[rule.consequent], strength);
    });

    // 3. Aggregation - implicit in defuzzification
    const aggregatedRiskFunction = (x: number) => Math.max(
        Math.min(riskActivations.low, risk.low(x)),
        Math.min(riskActivations.medium, risk.medium(x)),
        Math.min(riskActivations.high, risk.high(x))
    );

    // 4. Defuzzification (Centroid Method)
    const riskUniverse = { min: 0, max: 100, step: 1 };
    let numerator = 0;
    let denominator = 0;
    for (let x = riskUniverse.min; x <= riskUniverse.max; x += riskUniverse.step) {
        const weight = aggregatedRiskFunction(x);
        numerator += x * weight;
        denominator += weight;
    }
    
    if (denominator === 0) return 0;

    return Math.round(numerator / denominator);
}
