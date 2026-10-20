import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Button,
} from "@libs/web-components";
import { FixtureBody, Row } from "../_chrome";

type FormValues = {
  name: string;
  email: string;
  role: string;
  agreeToTerms: boolean;
};

export default function FormFixture() {
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      role: "",
      agreeToTerms: false,
    },
  });

  return (
    <FixtureBody>
      <Row label="form">
        <div style={{ maxWidth: 480, width: "100%" }}>
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(() => {})}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input scale="md" placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormDescription>Your display name visible to others.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input scale="md" type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger scale="md" className="w-full">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose the access level for this user.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="flex flex-col gap-1">
                      <FormLabel>Accept terms and conditions</FormLabel>
                      <FormDescription>
                        You agree to our terms of service and privacy policy.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" scale="md">
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </Row>
    </FixtureBody>
  );
}
