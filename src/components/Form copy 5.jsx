import React, {useState, useContext} from "react";
import { Context } from '../Context';

export default function Form(props){
    const [age, setAge] = useState(20)
    const [sex, setSex] = useState("männlich")
    const [country, setCountry] = useState("Deutschland")
    const { data } = useContext(Context);

    const [promptInfo, setPromptInfo] = useState({
        problem: "",
        solution: "",
        result: "",
        period: "", 
        startDate: "", 
        dailyStartTime: "", 
        dailyHours: "", 
        workDays: [],
        industry: ""
    })

    const [gesamtPrompt, setGesamtPrompt] = useState("")

    // Work days configuration
    const weekDays = [
        { id: 'monday', label: 'Montag', short: 'Mo' },
        { id: 'tuesday', label: 'Dienstag', short: 'Di' },
        { id: 'wednesday', label: 'Mittwoch', short: 'Mi' },
        { id: 'thursday', label: 'Donnerstag', short: 'Do' },
        { id: 'friday', label: 'Freitag', short: 'Fr' },
        { id: 'saturday', label: 'Samstag', short: 'Sa' },
        { id: 'sunday', label: 'Sonntag', short: 'So' }
    ];

    const [workDays, setWorkDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

    const handleWorkDayToggle = (dayId) => {
        setWorkDays(prev => 
            prev.includes(dayId) 
                ? prev.filter(day => day !== dayId)
                : [...prev, dayId]
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        setPromptInfo({
            problem: formData.get("problem"),
            solution: formData.get("solution"),
            result: formData.get("result"),
            period: formData.get("period"),
            startDate: formData.get("startDate"),
            dailyStartTime: formData.get("dailyStartTime"),
            dailyHours: formData.get("dailyHours"),
            workDays: workDays,
            industry: formData.get("industry"),
        });

        let AIRole = data.aiRolePrompt;

        // Convert workDays array to readable string for prompt
        const workDaysString = workDays.map(dayId => 
            weekDays.find(day => day.id === dayId)?.label
        ).join(', ');

        let prompt = data.promptTemplate.problem + formData.get("problem")
            + data.promptTemplate.solution + formData.get("solution")
            + data.promptTemplate.result + formData.get("result")
            + data.promptTemplate.period + formData.get("period")
            + data.promptTemplate.startDate + formData.get("startDate")
            + data.promptTemplate.dailyStartTime + formData.get("dailyStartTime")
            + data.promptTemplate.dailyHours + formData.get("dailyHours")
            + data.promptTemplate.workDays + workDaysString
            + data.promptTemplate.industry + formData.get("industry");

        const fullPrompt = AIRole + "\n\n" + prompt;

        console.log(fullPrompt);
        console.log('Selected work days:', workDays);

        props.onPromptChange(fullPrompt);
    };

    return(
        <div>
            {data.personalDataLabel}
            <br /><br />

            <form onSubmit={handleSubmit}>
                
                {data.ageLabel}
                <br />
                <input
                    type="text"
                    name="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                />
                <br /><br />
                
                {data.genderLabel}
                <br />
                <input
                    type="text"
                    name="sex"
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                />
                <br /><br />

                {data.countryLabel}
                <br />
                <input
                    type="text"
                    name="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                />
                <br /><br /><br />

                <label>
                    <b>{data.question1}</b><br />
                    <input type="text" name="problem" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question2}</b><br />
                    <input type="text" name="solution" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question3}</b><br />
                    <input type="number" name="period" min="1" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question4}</b><br />
                    <em>{data.question4Hint}</em><br />
                    <input type="text" name="result" required />
                </label>
                <br /><br />

                <label>
                    <b>{data.question5}</b><br />
                    <em>{data.question5Hint}</em><br />
                    <input type="date" name="startDate" required />
                </label>
                <br /><br />

                <label>
                    <b>{data.question6}</b><br />
                    <em>{data.question6Hint}</em><br />
                    <input type="time" name="dailyStartTime" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question7}</b><br />
                    <input type="number" name="dailyHours" min="1" max="12" required />
                </label>
                <br /><br />

                <label>
                    <b>{data.question8}</b><br />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                        {weekDays.map(day => (
                            <label key={day.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={workDays.includes(day.id)}
                                    onChange={() => handleWorkDayToggle(day.id)}
                                    style={{ marginRight: '5px' }}
                                />
                                <span>{day.short}</span>
                            </label>
                        ))}
                    </div>
                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                        Selected: {workDays.length} day{workDays.length !== 1 ? 's' : ''}
                    </small>
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question9}</b><br />
                    <em>{data.question9Hint}</em><br />
                    <input type="text" name="industry" required />
                </label>
                <br /><br />

                <br />
                <button className="button" type="submit">
                    {data.submitButton}
                </button>
                
            </form>
            {gesamtPrompt}
        </div>
    )
}