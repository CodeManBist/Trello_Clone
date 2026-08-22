import type { OnlineUser } from "@/hooks/useBoardWebSocket";

type UserProfileProps = {
  users: OnlineUser[];
  maxVisible?: number;
};

const getInitials = (
  username: string
) => {
  const name =
    username.trim();

  if (!name) {
    return "?";
  }

  const parts =
    name.split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name
    .slice(0, 2)
    .toUpperCase();
};

const UserProfile = ({
  users,
  maxVisible = 6,
}: UserProfileProps) => {
  const visibleUsers =
    users.slice(0, maxVisible);

  const remainingCount =
    users.length -
    visibleUsers.length;

  if (users.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No one else is online
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center">

      {/* ========================= */}
      {/* Avatar stack               */}
      {/* ========================= */}

      <div className="flex items-center">
        {visibleUsers.map(
          (user, index) => (
            <div
              key={user.id}
              className={[
                "relative",
                index > 0
                  ? "-ml-2"
                  : "",
                "z-10",
              ].join(" ")}
            >
              {/* Avatar */}

              <div
                title={user.username}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-background
                  bg-primary
                  text-xs
                  font-semibold
                  text-primary-foreground
                  shadow-sm
                  transition-transform
                  hover:z-20
                  hover:scale-110
                  sm:h-10
                  sm:w-10
                "
              >
                {getInitials(
                  user.username
                )}
              </div>

              {/* Online indicator */}

              {user.online && (
                <span
                  className="
                    absolute
                    bottom-0
                    right-0
                    h-2.5
                    w-2.5
                    rounded-full
                    border-2
                    border-background
                    bg-green-500
                  "
                />
              )}
            </div>
          )
        )}

        {/* ========================= */}
        {/* Remaining users            */}
        {/* ========================= */}

        {remainingCount > 0 && (
          <div
            title={`${remainingCount} more users`}
            className="
              relative
              -ml-2
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              border-2
              border-background
              bg-muted
              text-xs
              font-semibold
              text-muted-foreground
              sm:h-10
              sm:w-10
            "
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* ========================= */}
      {/* User count                */}
      {/* ========================= */}

      <span className="ml-3 hidden text-sm text-muted-foreground sm:block">
        {users.length}{" "}
        {users.length === 1
          ? "member"
          : "members"}{" "}
        online
      </span>
    </div>
  );
};

export default UserProfile;