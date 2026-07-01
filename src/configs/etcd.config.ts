import { registerAs } from "@nestjs/config";

export default registerAs('etcd', () => ({
    etcdAdvertiseClientUrls: process.env.ETCD_ADVERTISE_CLIENT_URLS || 'http://etcd:2379'
}))