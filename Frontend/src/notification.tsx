import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

const API_BASE = "http://192.168.1.9:5000";

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Fetch or set dummy userId for testing
        let storedUserId = await AsyncStorage.getItem("userId");

        if (!storedUserId) {
          storedUserId = "user123"; // fallback for testing
          await AsyncStorage.setItem("userId", storedUserId);
        }

        setUserId(storedUserId);

        // 2. Fetch notifications from backend
        await fetchNotifications(storedUserId);

        // 3. Initialize socket and register userId
        const newSocket = io(API_BASE, {
          transports: ["websocket"],
        });

        newSocket.on("connect", () => {
          console.log("✅ Connected to socket:", newSocket.id);
          newSocket.emit("register", storedUserId);
        });

        newSocket.on("new-notification", (data) => {
          console.log("🔔 New notification:", data);
          setNotifications((prev) => [data, ...prev]);
        });

        setSocket(newSocket);
      } catch (err) {
        console.error("Initialization error:", err);
        Alert.alert("Error", "Failed to initialize notifications");
      } finally {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (socket) {
        socket.disconnect();
        console.log("🔌 Socket disconnected");
      }
    };
  }, []);

  const fetchNotifications = async (uid: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/notifications`, {
        params: { userId: uid },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  notificationItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    fontSize: 14,
    color: "#666",
  },
});

export default NotificationsScreen;
