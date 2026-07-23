import { useState, useEffect } from "react";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { useNavigate } from "react-router";

const Form = ({ isSingedUp = false }) => {
  const [data, setData] = useState({
    ...(!isSingedUp && {
      fullName: "",
    }),
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("user:token");

    if (!token) {
      navigate("/users/sign_in");
    }
  }, [navigate]);

  const handleSumbit = async (e) => {
    e.preventDefault();
    const res = await fetch(
      `https://my-chat-app-tam8.onrender.com/api/${isSingedUp ? "login" : "register"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    if (res.status === 400) {
      alert("Invalid credentials");
    } else {
      const resData = await res.json();
      if (resData.token) {
        localStorage.setItem("user:token", resData.token);
        localStorage.setItem("user:details", JSON.stringify(resData.user));
        navigate("/");
      }
    }
  };

  return (
    <div className="bg-white h-screen flex items-center justify-center ">
      <div className="bg-white w-[400px] h-[600px] shadow-lg rounded-3xl flex flex-col justify-center items-center ">
        <div className="text-4xl font-extrabold">
          {isSingedUp ? "Welcome Back" : "Welcome"}
        </div>
        <div className="text-xl font-light mb-14">
          {isSingedUp ? "Sign in to explore" : "Sign up now to get started"}
        </div>
        <form
          className="flex flex-col items-center w-full"
          onSubmit={(e) => handleSumbit(e)}
        >
          {!isSingedUp && (
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your Full Name"
              className="mb-4"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
          )}
          <Input
            label="Email Address"
            name="Email"
            type="email"
            placeholder="Enter your Email"
            className="mb-4"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            name="name"
            type="password"
            placeholder="Enter your Password"
            className="mb-4"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <Button
            label={isSingedUp ? "Sign in" : "Sign Up"}
            className="w-[60%] mb-2"
            type="submit"
          />
        </form>

        <div className="text-sm">
          {isSingedUp ? "Didn't have an account " : "Already have an account?"}
          <span
            className="text-blue-400 cursor-pointer underline"
            onClick={() =>
              navigate(isSingedUp ? "/users/sign_up" : "/users/sign_in")
            }
          >
            {isSingedUp ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
};
export default Form;
