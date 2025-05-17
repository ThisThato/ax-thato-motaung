import { Link } from "react-router-dom";
import InputBox from "../components/input.component";
import GoogleIcon from "../imgs/google.png"
import AnimationWrapper from "../common/page-animation";

const UserAuthForm = ({type}) => {
    return(
        <AnimationWrapper keyValue={type}>
            <section className="h-cover flex items-center justify-center">
                <form className="w-[80%] max-w-[400px]">
                    <h1 className="tex-4xl font-gelasio capitalize text-center mb-24">
                        {type === "sign-in" ? "Welcome back" : "Join us today"}
                    </h1>
                    {
                        type !== 'sign-in' ? 
                        <InputBox name="fullname" type="text" placeholder="Full name" icon="fi-rr-user"/> : 
                        ""
                    }
                    {
                        <InputBox name="email" type="email" placeholder="Email" icon="fi-rr-envelope"/> 
                    }
                    {
                        <InputBox name="password" type="password" placeholder="Password" icon="fi-rr-key"/> 
                    }
                    <buton className="btn-dark center text-center mt-14 ml-20 mr-20"
                        type="submit">
                        {type.replace('-', " ")}
                    </buton>
                    <div className="relative w-full items-center flex gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black"/>
                        <p>or</p>
                        <hr className="w-1/2 border-black"/>
                        </div>
                        <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center">
                            <img src={GoogleIcon} className="w-5"/>
                            continue with google
                        </button>
                        {
                            type === 'sign-in' ? 
                            <p className="mt-6 text-dark-grey text-xl text-center">
                                Don't have an account ?
                                <Link to='/signup' className="underline text-black  text-xl ml-1">Join Us today</Link>
                            </p> : 
                            <p className="mt-6 text-dark-grey text-xl text-center">
                                Already a member ?
                                <Link to='/signin' className="underline text-black  text-xl ml-1">Sign in here</Link>
                            </p> 
                        }
                </form>
            </section>
        </AnimationWrapper>
    )
}

export default UserAuthForm;