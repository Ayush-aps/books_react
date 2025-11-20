"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/schemas/authSchema";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { PasswordInput } from "../../components/ui/PasswordInput"; // Import the new component
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";

export default function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onBlur", // Validate when user leaves the field
  });

  const onSubmit = (data) => {
    console.log("Data:", data);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-none bg-gradient-to-br from-neutral-300 via-neutral-100 to-neutral-300 p-px md:rounded-2xl dark:from-neutral-700 dark:via-neutral-900 dark:to-neutral-700">
      <div className="shadow-input w-full rounded-none bg-white p-4 md:rounded-[15px] md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome to Aceternity
        </h2>
        
        <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="firstname">First name</Label>
              <Input id="firstname" placeholder="Tyler" {...register("firstname")} />
              {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname.message}</p>}
            </LabelInputContainer>
            
            <LabelInputContainer>
              <Label htmlFor="lastname">Last name</Label>
              <Input id="lastname" placeholder="Durden" {...register("lastname")} />
              {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname.message}</p>}
            </LabelInputContainer>
          </div>

          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" placeholder="projectmayhem@fc.com" type="email" {...register("email")} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </LabelInputContainer>

          {/* PASSWORD FIELD with Eye Icon */}
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <PasswordInput 
              id="password" 
              placeholder="••••••••" 
              {...register("password")} 
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </LabelInputContainer>

          {/* CONFIRM PASSWORD FIELD with Eye Icon */}
          <LabelInputContainer className="mb-8">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput 
              id="confirmPassword" 
              placeholder="••••••••" 
              {...register("confirmPassword")} 
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </LabelInputContainer>

          <button
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
            type="submit"
            disabled={isSubmitting}
          >
            Sign up &rarr;
            <BottomGradient />
          </button>

           {/* Social buttons below... */}
           <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
           <div className="flex flex-col space-y-4">
            <button className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]" type="button">
              <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">GitHub</span>
              <BottomGradient />
            </button>
            <button className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]" type="button">
              <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Google</span>
              <BottomGradient />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);