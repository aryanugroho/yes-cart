REF: YC-571 Improve password hashing mechanism and WS communication channel security

To improve security salt was added for the MD5 hash helper algorithm to strengthen password hashes.

Refer to passwordHashHelper bean in core-services.xml for the configuration. By default salt is set to YCPWSALT.

Recommended actions for production upgrades is to let customers to use forgotten password functionality to reset
passwords.

Alternatively use old password and add YCPWSALT to the end. For managers' account we recommend rehashing existing
passwords.

If changing parameters is not an option leave salt parameter blank, which will work with passwords generated by
YC up to version 3.0.0