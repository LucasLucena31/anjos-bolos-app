import styles from "../styles/Button.module.css";

export function Button(props) {
    return(
        <button className={ styles.button } onClick={props.onClick}>{ props.function }</button>
    )
}