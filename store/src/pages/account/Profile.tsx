import ProfileForm from "@/components/forms/ProfileForm";
import AccountSkeleton from "@/components/skeletons/AccountSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCustomMutation,
  useGetIdentity,
  useNotification,
  useTranslate,
} from "@refinedev/core";
import { useRef, useState } from "react";

const Profile = () => {
  const avatar = useRef();
  const [previewAvatar, setPreviewAvatar] = useState();
  const t = useTranslate();
  const { data: profile, isLoading, refetch } = useGetIdentity();

  const { open } = useNotification();
  const { mutate, isLoading: isSubmitting } = useCustomMutation({
    mutationOptions: {
      onSettled: () => {
        refetch().then(() => {
          open?.({
            message: t("Profile updated successfully"),
            type: "success",
          });
        });
      },
    },
  });

  if (isLoading) {
    return <AccountSkeleton />;
  }

  return (
    <div className="lg:w-[410px] mx-auto">
      <h1 className="font-semibold text-darkgray-500 text-lg">
        {t("Account Details")}
      </h1>
      {/* FIXME: make the upload field functional <div className="flex items-center gap-3 mt-10">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={previewAvatar ?? profile.user?.user_image}
            alt={`${profile.user?.full_name} profile image`}
            onClick={() => avatar.current.click()}
          />
          <AvatarFallback>{profile.user?.full_name[0]}</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
           <p className="text-sm font-medium leading-none">
            {profile.user?.full_name}
          </p>
          <p className="text-sm text-muted-foreground">{profile.user?.email}</p> 
          <Button
            variant="link"
            size="sm"
            className="w-fit text-darkgray-500 p-0 font-semibold"
            onClick={() => avatar.current.click()}
          >
            {t("Edit Profile Picture")}
          </Button> 
          <Input
            type="file"
            className="hidden"
            ref={avatar}
            onChange={(e) =>
              setPreviewAvatar(URL.createObjectURL(e.target.files[0]))
            }
          />
        </div>
      </div> */}
      <div className="mt-6">
        <h1 className="font-semibold text-darkgray-200 mb-2">
          {t("Profile information")}
        </h1>
        <ProfileForm
          initialValues={{
            email: profile.user?.email,
            first_name: profile.user?.first_name,
            last_name: profile.user?.last_name,
          }}
          isSubmitting={isSubmitting}
          onSubmit={(values) => {
            return mutate({
              dataProviderName: "storeProvider",
              url: "update_profile",
              method: "post",
              values,
            });
          }}
        />
      </div>
    </div>
  );
};

export default Profile;
