# webRTC를 사용하면 안되는 경우

- peer 수가 너무 많아지는 경우 : 당연히 효율이 심각하게 저하된다.
  - 대체 수단 : SFU(Selective Forwarding Unit)
    - server에 의존하여 webRTC가 여러 peer를 처리할때와 같이 망형으로 처리되지 않고 서버가 각 peer들에게 받은 데이터를 압축하여 다른 peer들에게 전달해준다.

# dataChannel

모든 데이터를 주고받을 수 있는 기능
