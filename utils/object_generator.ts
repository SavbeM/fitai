import {GoalArray, ProfileBiometricsArray} from "@/validation/zodSchema";
import {ObjectGeneratorArgs, ObjectGeneratorReturnType} from "@/utils/utilsTypes";



export function generateProfileDefinition(
    profileData: ProfileBiometricsArray
): Record<string, { type: string; title: string; description: string; values: string }> {
    const { keys, types, title, description, values } = profileData;
    if (
        keys.length !== types.length ||
        keys.length !== title.length ||
        keys.length !== description.length ||
        keys.length !== values.length
    ) {
        throw new Error("Profile arrays must have the same length.");
    }
    const profileDefinition: Record<string, { type: string; title: string; description: string; values: string }> = {};
    for (let i = 0; i < keys.length; i++) {
        profileDefinition[keys[i]] = {
            type: types[i],
            title: title[i],
            description: description[i],
            values: values[i]
        };
    }
    return profileDefinition;
}

export function generateGoalDefinition(goalData: GoalArray): Record<string, { type: string; value: string }> {
    const goalDefinition: Record<string, { type: string; value: string }> = {};
    const { keys, types, values } = goalData;

    for (const prop in keys) {
        if (Object.prototype.hasOwnProperty.call(keys, prop)) {
            const keyName = keys[prop];
            goalDefinition[keyName] = {
                type: types[prop],
                value: values[prop],
            };
        }
    }
    return goalDefinition;
}


export function object_generator(args: ObjectGeneratorArgs): ObjectGeneratorReturnType {
    const profileDefinition = generateProfileDefinition(args.profile);
    const goalDefinition = generateGoalDefinition(args.goal);
    return { profileDefinition, goalDefinition };
}
