# Provisioning Engine

The provisioning engine manages hosting services.

Supported platforms:

- cPanel / WHM
- Plesk

Lifecycle operations:

CreateAccount
SuspendAccount
UnsuspendAccount
TerminateAccount
ChangePackage

Each integration must be implemented as a driver:

Drivers:

/drivers
   /cpanel
   /plesk