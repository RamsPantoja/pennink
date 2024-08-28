import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProfileEditor from "../YourBuuddy/ProfileEditor";
import useSettingsLogic from "./useSettingsLogic";

const SettingsContainer = () => {
  const {} = useSettingsLogic();

  return (
    <Card className="flex w-full flex-col gap-4 overflow-hidden">
      <h1 className="text-2xl font-bold text-mochaText">Settings</h1>
      <Tabs
        defaultValue="profile"
        className="flex h-full flex-col items-start overflow-hidden"
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="flex overflow-hidden">
          <ProfileEditor />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default SettingsContainer;
