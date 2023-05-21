import { GrCircleInformation } from 'react-icons/gr';
const InformationLabel = (props: { label: string, title: string, for?: string }) => {
    return (
        <div className="flex flex-row w-full gap-x-2 place-items-center">
            <label className="text-sm font-bold uppercase" htmlFor={props.for}>{props.label}</label>
            <span title={props.title}><GrCircleInformation /></span>
        </div>
    )
}
export default InformationLabel