class UserDto {
    id;
    phone;
    name;
    avatar;
    activated;
    createdAt;
    constructor(user) {
        this.id = user.id;
        this.phone = user.phone;
        this.name = user.name;
        this.avatar = user.avatar ? `${process.env.BASE_URL}${user.avatar}` : null;
        this.activated = user.activated;
        this.createdAt = user.created_at;
    }
}

export default UserDto;